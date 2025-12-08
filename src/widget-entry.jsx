import React from "react";
import ReactDOM from "react-dom/client";
import ChatbotWidget from "./components/ChatbotWidget";
import "./index.css";

// Immediately invoked
(function () {
    window.initChatbot = function (options = {}) {
        // Ensure a container exists
        let div = document.getElementById("chatbot-root");
        if (!div) {
            div = document.createElement("div");
            div.id = "chatbot-root";
            document.body.appendChild(div);
        }

        // Render React widget
        const root = ReactDOM.createRoot(div);
        root.render(<ChatbotWidget {...options} />);
    };

    // Optional: auto-init with defaults if desired
    // window.initChatbot({ theme: "light" });
})();


// import React from "react";
// import ReactDOM from "react-dom/client";
// import ChatbotWidget from "./components/ChatbotWidget";
// import "./index.css";

// (function () {
//   // Create a container div for the floating widget
//   let container = document.createElement("div");
//   container.id = "chatbot-container";
//   container.style.position = "fixed";
//   container.style.bottom = "20px";
//   container.style.right = "20px";
//   container.style.zIndex = "99999";
//   container.style.width = "400px";
//   container.style.maxWidth = "90vw";
//   container.style.height = "500px";
//   container.style.maxHeight = "80vh";
//   container.style.display = "none"; // hidden initially
//   container.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
//   container.style.borderRadius = "12px";
//   document.body.appendChild(container);

//   // Create a floating button
//   let button = document.createElement("button");
//   button.innerHTML = "💬";
//   button.style.position = "fixed";
//   button.style.bottom = "20px";
//   button.style.right = "20px";
//   button.style.zIndex = "99999";
//   button.style.width = "60px";
//   button.style.height = "60px";
//   button.style.borderRadius = "50%";
//   button.style.border = "none";
//   button.style.background = "#2563eb"; // Tailwind blue-600
//   button.style.color = "white";
//   button.style.fontSize = "24px";
//   button.style.cursor = "pointer";
//   button.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
//   document.body.appendChild(button);

//   // Toggle widget on button click
//   button.addEventListener("click", () => {
//     container.style.display = container.style.display === "none" ? "block" : "none";
//   });

//   // Render the chatbot widget inside container
//   const root = ReactDOM.createRoot(container);
//   root.render(<ChatbotWidget />);
// })();
