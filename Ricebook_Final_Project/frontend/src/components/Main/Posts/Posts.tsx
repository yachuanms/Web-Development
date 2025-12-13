import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { API_BASE_URL } from "../../../config";

const BACKEND_URL = API_BASE_URL;

const POST_IMAGE_STYLE: CSSProperties = {
  maxHeight: 320,
  width: "100%",
  objectFit: "contain",
};

type Comment = {
  _id?: string;
  author: string;
  text: string;
  date: string;
};

type Follower = {
  name?: string;
  username?: string;
  [key: string]: unknown;
};

type Post = {
  id: number;
  author: string;
  body: string;
  image?: string;
  date: string;
  comments?: Comment[];
  newComment?: string;
};

type ProfileBrief = {
  display: string;
  avatar: string;
};

export default function Posts({ followers }: { followers: Follower[] }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newText, setNewText] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [postDraft, setPostDraft] = useState("");
  const [editingComment, setEditingComment] = useState<
    { postId: number; commentId: string; text: string }
    | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [profiles, setProfiles] = useState<Record<string, ProfileBrief>>({});
  const profilesRef = useRef<Record<string, ProfileBrief>>({});

  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  const username = localStorage.getItem("username") || "";

  const loadProfilesForArticles = useCallback(async (articles: Post[]) => {
    const names = new Set<string>();
    articles.forEach((a) => {
      names.add(a.author);
      a.comments?.forEach((c) => names.add(c.author));
    });

    const missing = Array.from(names).filter((n) => !profilesRef.current[n]);

    if (missing.length === 0) return;

    const entries: [string, ProfileBrief][] = [];

    for (const name of missing) {
      try {
        const res = await fetch(`${BACKEND_URL}/profile/${name}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!data.error) {
          entries.push([
            name,
            {
              display: data.display || name,
              avatar:
                data.avatar || `https://i.pravatar.cc/100?u=${name}`,
            },
          ]);
        }
      } catch (e) {
        console.error("Failed to load profile for", name, e);
      }
    }

    if (entries.length > 0) {
      setProfiles((prev) => ({
        ...prev,
        ...Object.fromEntries(entries),
      }));
    }
  }, []);

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/articles`, {
        credentials: "include",
      });
      const data = await res.json();

      if (data.articles) {
        const sorted = data.articles.sort(
          (a: Post, b: Post) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setPosts(sorted);
        await loadProfilesForArticles(sorted);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Failed to load posts", err);
    }
  }, [loadProfilesForArticles]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const visiblePosts = posts.filter((p) => {
    const followerNames = followers.map((f) =>
      (f.name || f.username || "").toLowerCase()
    );

    const fromMe = p.author.toLowerCase() === username.toLowerCase();
    const fromFollower = followerNames.includes(p.author.toLowerCase());

    const matchSearch =
      p.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profiles[p.author]?.display || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return (fromMe || fromFollower) && matchSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, followers]);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(visiblePosts.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedPosts = visiblePosts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    return () => {
      if (editImagePreview) {
        URL.revokeObjectURL(editImagePreview);
      }
    };
  }, [editImagePreview]);

  async function handleAddPost() {
    if (!newText.trim()) return;

    try {
      const formData = new FormData();
      formData.append("body", newText);
      if (newImageFile) {
        formData.append("image", newImageFile);
      }

      const res = await fetch(`${BACKEND_URL}/article`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (data.articles && data.articles[0]) {
        const newArticle = data.articles[0] as Post;
        setPosts((prev) => [newArticle, ...prev]);
        await loadProfilesForArticles([newArticle]);
        setCurrentPage(1);
      }
      setNewText("");
      setNewImageFile(null);
    } catch (err) {
      console.error("Cannot add post", err);
    }
  }

  function resetEditingState() {
    setEditingPostId(null);
    setPostDraft("");
    if (editImagePreview) {
      URL.revokeObjectURL(editImagePreview);
    }
    setEditImagePreview(null);
    setEditImageFile(null);
    setRemoveImage(false);
  }

  function handleEditImageChange(file: File | null) {
    if (editImagePreview) {
      URL.revokeObjectURL(editImagePreview);
    }
    if (file) {
      setEditImagePreview(URL.createObjectURL(file));
      setEditImageFile(file);
      setRemoveImage(false);
    } else {
      setEditImagePreview(null);
      setEditImageFile(null);
    }
  }

  async function handleSavePost() {
    if (editingPostId === null) return;
    if (!postDraft.trim()) return;

    try {
      const formData = new FormData();
      formData.append("body", postDraft);
      formData.append("removeImage", String(removeImage));
      if (editImageFile) {
        formData.append("image", editImageFile);
      }

      const res = await fetch(`${BACKEND_URL}/articles/${editingPostId}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (data.articles && data.articles[0]) {
        const updated = data.articles[0] as Post;
        setPosts((prev) =>
          prev.map((p) =>
            p.id === updated.id
              ? { ...p, ...updated, newComment: p.newComment }
              : p
          )
        );
        resetEditingState();
      }
    } catch (err) {
      console.error("Failed to update post", err);
    }
  }

  async function handleDeletePost(postId: number) {
    const confirmDelete = window.confirm("Delete this post?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${BACKEND_URL}/articles/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.error) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        if (editingPostId === postId) {
          resetEditingState();
        }
      }
    } catch (err) {
      console.error("Failed to delete post", err);
    }
  }

  async function handleSaveComment() {
    if (!editingComment || !editingComment.text.trim()) return;

    try {
      const res = await fetch(
        `${BACKEND_URL}/article/${editingComment.postId}/comment/${editingComment.commentId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: editingComment.text }),
        }
      );

      const data = await res.json();
      if (data.comments) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === editingComment.postId
              ? { ...post, comments: data.comments }
              : post
          )
        );
        setEditingComment(null);
      }
    } catch (err) {
      console.error("Failed to update comment", err);
    }
  }

  async function handleDeleteComment(postId: number, commentId: string) {
    const confirmDelete = window.confirm("Delete this comment?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `${BACKEND_URL}/article/${postId}/comment/${commentId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.comments) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, comments: data.comments } : post
          )
        );
        if (
          editingComment &&
          editingComment.postId === postId &&
          editingComment.commentId === commentId
        ) {
          setEditingComment(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  }

  return (
    <div>
      <div className="card p-3 mb-4 shadow-sm">
        <textarea
          className="form-control mb-2"
          rows={3}
          placeholder="What's on your mind?"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />

        <div className="d-flex align-items-center gap-2 mb-2">
          <input
            type="file"
            accept="image/*"
            className="form-control"
            onChange={(e) =>
              setNewImageFile(e.target.files?.[0] || null)
            }
          />
          <button className="btn btn-primary" onClick={handleAddPost}>
            Post
          </button>
        </div>
      </div>

      <div className="input-group mb-3">
        <span className="input-group-text">Search</span>
        <input
          className="form-control"
          placeholder="Search by author, display name, or text..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {visiblePosts.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span>
            Showing {paginatedPosts.length} of {visiblePosts.length} posts
          </span>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span>
              Page {currentPage} / {totalPages}
            </span>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
            >
              Next
            </button>
          </div>
        </div>
      )}

      {paginatedPosts.map((p) => {
        const authorProfile = profiles[p.author];
        const displayName = authorProfile?.display || p.author;
        const avatar =
          authorProfile?.avatar ||
          `https://i.pravatar.cc/100?u=${p.author}`;
        const isEditingThisPost = editingPostId === p.id;

        return (
          <div key={p.id} className="card mb-3 shadow-sm position-relative">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center">
                  <img
                    src={avatar}
                    alt={p.author}
                    width={40}
                    height={40}
                    className="rounded-circle me-2"
                  />
                  <div>
                    <strong>{displayName}</strong>
                    <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                      @{p.author}
                    </div>
                  </div>
                </div>
                {p.author === username && (
                  <div className="d-flex align-items-center gap-2">
                    {!isEditingThisPost && (
                      <button
                        type="button"
                        className="btn btn-link text-secondary p-0"
                        title="Edit post"
                        onClick={() => {
                          setEditingPostId(p.id);
                          setPostDraft(p.body || "");
                          handleEditImageChange(null);
                          setRemoveImage(false);
                        }}
                      >
                        <i className="bi bi-pencil-square" style={{ fontSize: "1.25rem" }} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-link text-danger p-0"
                      title="Delete post"
                      onClick={() => handleDeletePost(p.id)}
                    >
                      <i className="bi bi-trash" style={{ fontSize: "1.25rem" }} />
                    </button>
                  </div>
                )}
              </div>

              {isEditingThisPost ? (
                <div className="mb-3">
                  <textarea
                    className="form-control mb-2"
                    rows={3}
                    value={postDraft}
                    onChange={(e) => setPostDraft(e.target.value)}
                  />
                  <div className="d-flex flex-column gap-2 mb-2">
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={(e) =>
                          handleEditImageChange(e.target.files?.[0] || null)
                        }
                      />
                      {(p.image || editImageFile) && (
                        <div className="form-check ms-1">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`remove-image-${p.id}`}
                            checked={removeImage}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setRemoveImage(checked);
                              if (checked) {
                                handleEditImageChange(null);
                              }
                            }}
                          />
                          <label className="form-check-label" htmlFor={`remove-image-${p.id}`}>
                            Remove image
                          </label>
                        </div>
                      )}
                    </div>
                    {!removeImage && editImagePreview && (
                      <img
                        src={editImagePreview}
                        alt="new upload preview"
                        className="rounded border"
                        style={POST_IMAGE_STYLE}
                      />
                    )}
                    {!removeImage && !editImagePreview && p.image && (
                      <img
                        src={p.image}
                        alt="current"
                        className="rounded border"
                        style={POST_IMAGE_STYLE}
                      />
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={handleSavePost}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={resetEditingState}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p>{p.body}</p>
              )}

              {p.image && (
                <img
                  src={p.image}
                  alt="post"
                  className="img-fluid rounded mb-2"
                  style={POST_IMAGE_STYLE}
                />
              )}

              <small className="text-muted d-block mb-2">
                Posted on {new Date(p.date).toLocaleString()}
              </small>

              <div className="mt-3">
                <h6>Comments</h6>

                {p.comments && p.comments.length > 0 ? (
                  p.comments.map((c, idx) => {
                    const cp = profiles[c.author];
                    const cDisplay = cp?.display || c.author;
                    const cAvatar =
                      cp?.avatar ||
                      `https://i.pravatar.cc/100?u=${c.author}`;
                    const commentKey = c._id || String(idx);
                    const canEditComment = c.author === username && Boolean(c._id);
                    const isEditingThisComment =
                      editingComment?.postId === p.id &&
                      editingComment?.commentId === commentKey;

                    return (
                      <div
                        key={commentKey}
                        className="border rounded p-2 mb-2 bg-light d-flex"
                      >
                        <img
                          src={cAvatar}
                          alt={c.author}
                          width={32}
                          height={32}
                          className="rounded-circle me-2"
                        />
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>{cDisplay}</strong>{" "}
                              <small className="text-muted">
                                @{c.author} ·{" "}
                                {new Date(c.date).toLocaleString()}
                              </small>
                            </div>
                            {!isEditingThisComment && canEditComment && (
                              <div className="d-flex align-items-center gap-2">
                                <button
                                  className="btn btn-link btn-sm p-0 text-secondary"
                                  title="Edit comment"
                                  onClick={() =>
                                    setEditingComment({
                                      postId: p.id,
                                      commentId: commentKey,
                                      text: c.text,
                                    })
                                  }
                                >
                                  <i className="bi bi-pencil-square" />
                                </button>
                                <button
                                  className="btn btn-link btn-sm p-0 text-danger"
                                  title="Delete comment"
                                  onClick={() => handleDeleteComment(p.id, commentKey)}
                                >
                                  <i className="bi bi-trash" />
                                </button>
                              </div>
                            )}
                          </div>
                          {isEditingThisComment ? (
                            <>
                              <textarea
                                className="form-control my-2"
                                rows={2}
                                value={editingComment?.text || ""}
                                onChange={(e) =>
                                  setEditingComment((prev) =>
                                    prev
                                      ? { ...prev, text: e.target.value }
                                      : prev
                                  )
                                }
                              />
                              <div className="d-flex gap-2 mb-1">
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={handleSaveComment}
                                >
                                  Save
                                </button>
                                <button
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => setEditingComment(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <p className="mb-1">{c.text}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted">No comments yet.</p>
                )}

                <div className="input-group mt-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Write a comment..."
                    value={p.newComment || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPosts((prev) =>
                        prev.map((post) =>
                          post.id === p.id
                            ? { ...post, newComment: value }
                            : post
                        )
                      );
                    }}
                  />
                  <button
                    className="btn btn-outline-primary"
                    onClick={async () => {
                      const text = p.newComment?.trim();
                      if (!text) return;

                      try {
                        const res = await fetch(
                          `${BACKEND_URL}/article/${p.id}/comment`,
                          {
                            method: "POST",
                            credentials: "include",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ text }),
                          }
                        );

                        const data = await res.json();

                        if (data.comments) {
                          setPosts((prev) =>
                            prev.map((post) =>
                              post.id === p.id
                                ? {
                                    ...post,
                                    comments: data.comments,
                                    newComment: "",
                                  }
                                : post
                            )
                          );
                          await loadProfilesForArticles([
                            {
                              ...p,
                              comments: data.comments,
                            },
                          ]);
                        }
                      } catch (err) {
                        console.error("Failed to add comment", err);
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {visiblePosts.length === 0 && (
        <p className="text-center text-muted">No posts to show.</p>
      )}
    </div>
  );
}

