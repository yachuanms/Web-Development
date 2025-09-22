document.addEventListener("DOMContentLoaded", () => {
    const posts = document.querySelectorAll(".pictureSlide[data-images]");

    posts.forEach(post => {
        const img = post.querySelector("img");
        const btn = post.querySelector(".toggleBtn");

        const imgList = post.dataset.images
            .split(",")
            .map(url => url.trim())
            .filter(url => url.length > 0);

        let imgIndex = 0;
        let sliding = true;
        let slide = null;

        function startInterval() {
            function changeImage() {
                imgIndex = (imgIndex + 1) % imgList.length;
                img.src = imgList[imgIndex];

                const delayTime = Math.floor((Math.random() * 5 + 1)) * 1000; // 1-5 秒
                slide = setTimeout(changeImage, delayTime);
            }
            changeImage();
        }

        function stopInterval() {
            clearTimeout(slide);
            slide = null;
        }

        // 預設啟動
        startInterval();

        btn.addEventListener("click", () => {
            if (sliding) {
                stopInterval();
                btn.textContent = "▶ Start";
            } else {
                startInterval();
                btn.textContent = "⏸ Pause";
            }
            sliding = !sliding;
        });
    });
});
