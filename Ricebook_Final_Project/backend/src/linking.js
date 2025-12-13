const User = require('../models/user');
const Profile = require('../models/profile');
const Article = require('../models/article');

function mergeProviderArrays(primary, secondary) {
  const merged = new Map();
  [...primary, ...secondary].forEach((provider) => {
    if (!provider) return;
    const key = `${provider.provider}:${provider.providerId}`;
    merged.set(key, provider);
  });
  return Array.from(merged.values());
}

async function mergeProfiles(primaryUsername, secondaryUsername) {
  const [primaryProfile, secondaryProfile] = await Promise.all([
    Profile.findOne({ username: primaryUsername }),
    Profile.findOne({ username: secondaryUsername })
  ]);

  if (!secondaryProfile) {
    return;
  }

  if (!primaryProfile) {
    secondaryProfile.username = primaryUsername;
    await secondaryProfile.save();
    return;
  }

  const mergedFollowing = new Set([
    ...primaryProfile.following,
    ...secondaryProfile.following.filter((f) => f !== primaryUsername)
  ]);
  primaryProfile.following = Array.from(mergedFollowing);

  const fieldsToFill = ['display', 'headline', 'avatar', 'email', 'zipcode', 'dob', 'phone'];
  fieldsToFill.forEach((field) => {
    if (!primaryProfile[field] && secondaryProfile[field]) {
      primaryProfile[field] = secondaryProfile[field];
    }
  });

  await primaryProfile.save();
  await Profile.deleteOne({ username: secondaryUsername });
}

async function mergeAccounts(primaryUsername, secondaryUsername) {
  if (primaryUsername === secondaryUsername) {
    return User.findOne({ username: primaryUsername });
  }

  const [primaryUser, secondaryUser] = await Promise.all([
    User.findOne({ username: primaryUsername }),
    User.findOne({ username: secondaryUsername })
  ]);

  if (!primaryUser || !secondaryUser) {
    return primaryUser || secondaryUser;
  }

  primaryUser.authProviders = mergeProviderArrays(primaryUser.authProviders, secondaryUser.authProviders);
  if (!primaryUser.email && secondaryUser.email) {
    primaryUser.email = secondaryUser.email;
  }

  await Article.updateMany({ author: secondaryUsername }, { $set: { author: primaryUsername } });
  await Article.updateMany(
    { 'comments.author': secondaryUsername },
    {
      $set: { 'comments.$[elem].author': primaryUsername }
    },
    {
      arrayFilters: [{ 'elem.author': secondaryUsername }]
    }
  );

  // 先把有追 secondary 的人補上一份 primary
await Profile.updateMany(
  { following: secondaryUsername },
  {
    $addToSet: { following: primaryUsername }
  }
);

// 再把 secondary 從 following 陣列裡拔掉
await Profile.updateMany(
  { following: secondaryUsername },
  {
    $pull: { following: secondaryUsername }
  }
);


  await mergeProfiles(primaryUsername, secondaryUsername);
  await User.deleteOne({ username: secondaryUsername });
  await primaryUser.save();

  return primaryUser;
}

module.exports = {
  mergeAccounts
};
