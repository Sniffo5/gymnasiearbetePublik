const fs = require("fs");

function render(content) {
  let html = fs.readFileSync("html/index.html").toString();

  html = html.replace("**content**", content);

  return html;
}

function funnyGenerate() {
  return `<video autoplay loop>
        <source src="https://video.twimg.com/ext_tw_video/1905350127877062663/pu/vid/avc1/720x724/6vY_V2UJRWxuqp4T.mp4?tag=12" type="video/mp4">
    </video> <style>
        body, html {
            height: 100%;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #000; /* Optional: sets the background color */
        }

        video {
            max-width: 100%;
            max-height: 100%;
        }

        header{
        display: none;}
    </style>`;
}
module.exports = { render, funnyGenerate };
