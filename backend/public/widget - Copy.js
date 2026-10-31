(function () {
  const currentScript = document.currentScript;
  const apiKey = currentScript
    ? currentScript.getAttribute("data-api-key")
    : null;

  if (!apiKey) {
    console.error("Chatbot Widget: data-api-key attribute missing.");
    return;
  }

  // Deduce backend base URL
  const scriptUrl = new URL(currentScript.src);
  const BASE_URL = `${scriptUrl.protocol}//${scriptUrl.host}`;

  fetch(`${BASE_URL}/api/v1/widget/init?apiKey=${apiKey}`)
    .then((res) => {
      if (!res.ok) throw new Error("Service inactive or expired");
      return res.json();
    })
    .then((data) => {
      if (!data.active) return;
      initWidget(data.branding, data.organizationName, data.faqs || []);
    })
    .catch((err) => {
      console.warn("Chatbot disabled:", err.message);
    });

  function initWidget(branding, orgName, faqs) {
    const themeColor = branding.themeColor || "#4f46e5";
    const botName = branding.botName || `${orgName} Assistant`;
    const welcomeMsg =
      branding.welcomeMessage ||
      `Hi! I'm the ${botName}. How can I help you today?`;
    const isRight = branding.position !== "bottom-left";

    // 1. Create Isolated Shadow DOM
    const host = document.createElement("div");
    host.id = "modern-chatbot-root";
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });

    // 2. CSS Styles
    const style = document.createElement("style");
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      
      /* Launcher Floating Button */
      .launcher {
        position: fixed; bottom: 24px; ${isRight ? "right: 24px;" : "left: 24px;"}
        width: 60px; height: 60px; border-radius: 50%;
        background-color: ${themeColor}; color: #ffffff;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
        cursor: pointer; z-index: 2147483647;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .launcher:hover { transform: scale(1.06); }
      .launcher svg { width: 28px; height: 28px; fill: currentColor; }

      /* Main Window */
      .chat-window {
        position: fixed; bottom: 96px; ${isRight ? "right: 24px;" : "left: 24px;"}
        width: 380px; max-width: calc(100vw - 48px); height: 560px; max-height: calc(100vh - 120px);
        background: #ffffff; border-radius: 20px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14), 0 0 1px rgba(0,0,0,0.1);
        display: none; flex-direction: column; overflow: hidden;
        z-index: 2147483647; border: 1px solid #f1f5f9;
        animation: slideUp 0.25s ease-out;
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Header */
      .header {
        background-color: ${themeColor}; color: #ffffff;
        padding: 16px 18px; display: flex; align-items: center; justify-content: space-between;
      }
      .header-info { display: flex; align-items: center; gap: 12px; }
      .brand-logo {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
        background: #ffffff;
        padding: 2px;
        border: 1.5px solid rgba(255, 255, 255, 0.6);
        flex-shrink: 0;
      }
      .status-dot {
        width: 8px; height: 8px; background-color: #22c55e;
        border-radius: 50%; display: inline-block;
      }
      .header-titles h3 { font-size: 14.5px; font-weight: 700; line-height: 1.2; }
      .header-titles p { font-size: 11px; opacity: 0.85; margin-top: 2px; }
      .close-btn {
        background: none; border: none; color: #ffffff;
        cursor: pointer; opacity: 0.8; font-size: 18px; line-height: 1;
        padding: 4px; border-radius: 6px;
      }
      .close-btn:hover { opacity: 1; background: rgba(255,255,255,0.15); }

      /* Message Flow Body */
      .body {
        flex: 1; padding: 18px; overflow-y: auto;
        display: flex; flex-direction: column; gap: 12px;
        background-color: #ffffff;
      }
      .bubble {
        padding: 12px 16px; border-radius: 16px; font-size: 13.5px;
        line-height: 1.45; max-width: 84%; word-wrap: break-word;
      }
      .bubble.bot {
        background: #f8fafc; color: #1e293b;
        align-self: flex-start; border: 1px solid #e2e8f0;
        border-bottom-left-radius: 4px;
      }
      .bubble.user {
        background: ${themeColor}; color: #ffffff;
        align-self: flex-end; border-bottom-right-radius: 4px;
      }

      /* Quick-Action Chips */
      .chips-container {
        display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;
      }
      .chip-btn {
        background: #ffffff; border: 1.5px solid ${themeColor};
        color: ${themeColor}; padding: 7px 14px; border-radius: 20px;
        font-size: 12px; font-weight: 600; cursor: pointer;
        transition: all 0.15s ease;
      }
      .chip-btn:hover {
        background: ${themeColor}; color: #ffffff;
      }

      /* Lead / Quote Card Form */
      .enquiry-card {
        background: #f8fafc; border: 1px solid #e2e8f0;
        border-radius: 14px; padding: 14px; display: flex;
        flex-direction: column; gap: 8px; margin-top: 4px;
      }
      .enquiry-card h4 { font-size: 12.5px; color: #1e293b; font-weight: 700; }
      .enquiry-card input, .enquiry-card textarea, .enquiry-card select {
        width: 100%; padding: 8px 10px; font-size: 12px;
        border: 1px solid #cbd5e1; border-radius: 8px; outline: none;
        background: #ffffff;
      }
      .enquiry-card input:focus, .enquiry-card textarea:focus, .enquiry-card select:focus {
        border-color: ${themeColor};
      }
      .submit-card-btn {
        background: ${themeColor}; color: #ffffff; border: none;
        padding: 8px 12px; border-radius: 8px; font-size: 12px;
        font-weight: 600; cursor: pointer; transition: opacity 0.15s;
      }
      .submit-card-btn:hover { opacity: 0.92; }

      /* Bottom Input Area */
      .footer-input-area {
        padding: 12px 14px 8px; border-top: 1px solid #f1f5f9;
        background: #ffffff;
      }
      .input-wrapper {
        display: flex; align-items: center; gap: 8px;
        background: #ffffff; border: 1.5px solid #cbd5e1;
        border-radius: 30px; padding: 4px 6px 4px 14px;
        transition: border-color 0.15s;
      }
      .input-wrapper:focus-within {
        border-color: ${themeColor};
      }
      .input-wrapper input {
        flex: 1; border: none; outline: none;
        font-size: 13px; color: #1e293b; background: transparent;
      }
      .input-wrapper input::placeholder { color: #94a3b8; }
      .send-btn {
        background-color: ${themeColor}; color: #ffffff;
        border: none; border-radius: 20px; padding: 7px 16px;
        font-size: 13px; font-weight: 600; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: opacity 0.15s ease;
      }
      .send-btn:hover { opacity: 0.92; }

      /* Subtitle note */
      .footer-branding {
        text-align: center; font-size: 10.5px; color: #94a3b8;
        padding-bottom: 8px;
      }
    `;

    // 3. HTML Markup
    const widget = document.createElement("div");
    widget.innerHTML = `
      <!-- Launcher Button -->
      <div class="launcher" id="launcherBtn" title="Chat with us">
        <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
      </div>

      <!-- Chat Window -->
      <div class="chat-window" id="chatWin">
        <!-- Header -->
        <div class="header">
          <div class="header-info">
            ${
              branding.logoUrl
                ? `<img src="${branding.logoUrl}" class="brand-logo" alt="Logo" onerror="this.style.display='none'" />`
                : `<div class="status-dot"></div>`
            }
            <div class="header-titles">
              <div style="display: flex; align-items: center; gap: 6px;">
                <h3>${botName}</h3>
                ${branding.logoUrl ? `<span class="status-dot"></span>` : ""}
              </div>
              <p>Typically replies instantly</p>
            </div>
          </div>
          <button class="close-btn" id="closeBtn">✕</button>
        </div>

        <!-- Chat History -->
        <div class="body" id="chatBody"></div>

        <!-- Text Input Footer -->
        <div class="footer-input-area">
          <div class="input-wrapper">
            <input type="text" id="userInput" placeholder="Type your message..." />
            <button class="send-btn" id="sendBtn">Send</button>
          </div>
        </div>
        <div class="footer-branding">Automated assistant • ${orgName}</div>
      </div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(widget);

    // 4. Element Selectors
    const chatWin = shadow.getElementById("chatWin");
    const launcherBtn = shadow.getElementById("launcherBtn");
    const closeBtn = shadow.getElementById("closeBtn");
    const chatBody = shadow.getElementById("chatBody");
    const userInput = shadow.getElementById("userInput");
    const sendBtn = shadow.getElementById("sendBtn");

    // Toggle Launcher
    launcherBtn.onclick = () => {
      const isVisible = chatWin.style.display === "flex";
      chatWin.style.display = isVisible ? "none" : "flex";
      if (!isVisible) userInput.focus();
    };
    closeBtn.onclick = () => {
      chatWin.style.display = "none";
    };

    // Helper: Append Chat Bubbles
    function appendBubble(sender, text) {
      const div = document.createElement("div");
      div.className = `bubble ${sender}`;
      div.innerText = text;
      chatBody.appendChild(div);
      chatBody.scrollTop = chatBody.scrollHeight;
      return div;
    }

    // Helper: Render Enquiry/Quote Form Card
    function showEnquiryFormold(title = "Request a Project Quote") {
      const card = document.createElement("div");
      card.className = "enquiry-card";
      card.innerHTML = `
        <h4>${title}</h4>
        <input type="text" placeholder="Full Name *" id="quoteName" />
        <input type="email" placeholder="Business Email *" id="quoteEmail" />
        <input type="text" placeholder="Company / Organization" id="quoteCompany" />
        <select id="quoteService">
          <option value="IoT & Embedded">IoT & Embedded Systems</option>
          <option value="Cloud & DevOps">Cloud & DevOps Engineering</option>
          <option value="Telecom & Networking">Telecom & 5G Solutions</option>
          <option value="Custom Software">Custom Enterprise Software</option>
          <option value="General Inquiry">General / Other</option>
        </select>
        <textarea rows="2" placeholder="Tell us about your project requirements..." id="quoteMsg"></textarea>
        <button class="submit-card-btn" id="quoteSubmitBtn">Submit Request</button>
      `;
      chatBody.appendChild(card);
      chatBody.scrollTop = chatBody.scrollHeight;

      const submitBtn = card.querySelector("#quoteSubmitBtn");
      submitBtn.onclick = async () => {
        const name = card.querySelector("#quoteName").value.trim();
        const email = card.querySelector("#quoteEmail").value.trim();
        const company = card.querySelector("#quoteCompany").value.trim();
        const serviceInterest = card.querySelector("#quoteService").value;
        const message = card.querySelector("#quoteMsg").value.trim();

        if (!name || !email || !message) {
          alert("Please fill out all mandatory fields.");
          return;
        }

        submitBtn.disabled = true;
        submitBtn.innerText = "Submitting...";

        try {
          const res = await fetch(`${BASE_URL}/api/v1/widget/enquiry`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiKey,
              name,
              email,
              company,
              serviceInterest,
              message,
            }),
          });

          if (res.ok) {
            card.remove();
            appendBubble(
              "bot",
              `Thank you ${name}! We have routed your request to our ${serviceInterest} team. We will get back to you shortly.`,
            );
          } else {
            submitBtn.disabled = false;
            submitBtn.innerText = "Submit Request";
            alert("Failed to submit. Please try again.");
          }
        } catch {
          submitBtn.disabled = false;
          submitBtn.innerText = "Submit Request";
          alert("Connection error. Please try again.");
        }
      };
    }

    function showEnquiryForm(title = "Request a Project Quote") {
      const card = document.createElement("div");
      card.className = "enquiry-card";
      card.innerHTML = `
        <h4>${title}</h4>
        <input type="text" placeholder="Full Name *" id="quoteName" maxlength="80" autocomplete="name" />
        <input type="email" placeholder="Business Email *" id="quoteEmail" maxlength="100" autocomplete="email" />
        <input type="tel" placeholder="Phone Number (Optional)" id="quotePhone" maxlength="20" autocomplete="tel" />
        <input type="text" placeholder="Company / Organisation (Optional)" id="quoteCompany" maxlength="100" />
        <select id="quoteService">
          <option value="IoT & Embedded">IoT & Embedded Systems</option>
          <option value="Cloud & DevOps">Cloud & DevOps Engineering</option>
          <option value="Telecom & Networking">Telecom & 5G Solutions</option>
          <option value="Custom Software">Custom Enterprise Software</option>
          <option value="General Inquiry">General / Other</option>
        </select>
        <textarea rows="3" placeholder="Tell us about your requirements... *" id="quoteMsg" maxlength="1500"></textarea>
        <div id="formErrorMsg" style="color: #ef4444; font-size: 11px; display: none; line-height: 1.3;"></div>
        <button class="submit-card-btn" id="quoteSubmitBtn">Submit Request</button>
      `;
      chatBody.appendChild(card);
      chatBody.scrollTop = chatBody.scrollHeight;

      const submitBtn = card.querySelector("#quoteSubmitBtn");
      const errorDiv = card.querySelector("#formErrorMsg");

      const showError = (msg) => {
        errorDiv.textContent = msg;
        errorDiv.style.display = "block";
        chatBody.scrollTop = chatBody.scrollHeight;
      };

      const clearError = () => {
        errorDiv.textContent = "";
        errorDiv.style.display = "none";
      };

      submitBtn.onclick = async () => {
        clearError();

        const name = card.querySelector("#quoteName").value.trim();
        const email = card.querySelector("#quoteEmail").value.trim();
        const phone = card.querySelector("#quotePhone").value.trim();
        const company = card.querySelector("#quoteCompany").value.trim();
        const serviceInterest = card.querySelector("#quoteService").value;
        const message = card.querySelector("#quoteMsg").value.trim();

        // 1. Mandatory checks
        if (!name) {
          showError("Please enter your name.");
          return;
        }
        if (name.length < 2) {
          showError("Name must be at least 2 characters.");
          return;
        }

        // 2. Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!email || !emailRegex.test(email)) {
          showError("Please enter a valid email address.");
          return;
        }

        // 3. Optional Phone validation (if provided)
        if (phone) {
          const phoneRegex = /^[+0-9\s\-()]{7,20}$/;
          if (!phoneRegex.test(phone)) {
            showError(
              "Please enter a valid phone number (digits, spaces, or + only).",
            );
            return;
          }
        }

        // 4. Message length check
        if (!message || message.length < 5) {
          showError(
            "Please provide a short description of your project (min 5 characters).",
          );
          return;
        }

        submitBtn.disabled = true;
        submitBtn.innerText = "Submitting...";

        try {
          const res = await fetch(`${BASE_URL}/api/v1/widget/enquiry`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiKey: String(apiKey), // Force string
              name,
              email,
              phone,
              company,
              serviceInterest,
              message,
            }),
          });

          const data = await res.json();

          if (res.ok && data.success) {
            card.remove();
            appendBubble(
              "bot",
              `Thank you ${name}! We have received your request regarding ${serviceInterest}. Our team will get in touch with you shortly.`,
            );
          } else {
            submitBtn.disabled = false;
            submitBtn.innerText = "Submit Request";
            showError(
              data.error || data.message || "Failed to submit request.",
            );
          }
        } catch {
          submitBtn.disabled = false;
          submitBtn.innerText = "Submit Request";
          showError("Connection lost. Please try again.");
        }
      };
    }

    // 5. Initial Welcome Flow + Action Chips
    appendBubble("bot", welcomeMsg);

    const chipsWrapper = document.createElement("div");
    chipsWrapper.className = "chips-container";

    // Prioritize pinned default chips, then fill remaining slots up to 3 FAQ chips
    const pinnedFaqs = faqs.filter((f) => f.isDefaultChip);
    const regularFaqs = faqs.filter((f) => !f.isDefaultChip);
    const selectedFaqChips = [...pinnedFaqs, ...regularFaqs].slice(0, 3);

    const actionChips = [];

    // Add FAQ action chips
    selectedFaqChips.forEach((faq) => {
      actionChips.push({
        label: faq.question,
        action: () => {
          appendBubble("user", faq.question);
          setTimeout(() => appendBubble("bot", faq.answer), 300);
        },
      });
    });

    // Always include standard quote and contact triggers
    actionChips.push(
      { label: "Get a quote", action: () => showEnquiryForm("Get a Quote") },
      { label: "Contact us", action: () => showEnquiryForm("Contact Us") },
    );

    actionChips.forEach((chip) => {
      const btn = document.createElement("button");
      btn.className = "chip-btn";
      btn.innerText = chip.label;
      btn.onclick = () => {
        chip.action();
      };
      chipsWrapper.appendChild(btn);
    });

    chatBody.appendChild(chipsWrapper);

    // 6. Handle User Input & Knowledge Base Matching
    const handleSend = async () => {
      const query = userInput.value.trim();
      if (!query) return;

      appendBubble("user", query);
      userInput.value = "";

      // Intercept quote or contact queries
      const lower = query.toLowerCase();
      if (
        lower.includes("quote") ||
        lower.includes("pricing") ||
        lower.includes("contact") ||
        lower.includes("hire")
      ) {
        setTimeout(() => {
          appendBubble(
            "bot",
            "We'd love to help with that! Please share your details below:",
          );
          showEnquiryForm("Request a Quote / Enquiry");
        }, 300);
        return;
      }

      // Query FAQ knowledge base
      try {
        const res = await fetch(`${BASE_URL}/api/v1/widget/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, query }),
        });
        const data = await res.json();
        appendBubble(
          "bot",
          data.answer ||
            "I'm not sure about that. Would you like to get a quote or contact our team?",
        );
      } catch {
        appendBubble(
          "bot",
          "I'm having trouble connecting right now. Please leave an enquiry and we'll reply soon.",
        );
        showEnquiryForm();
      }
    };

    sendBtn.onclick = handleSend;
    userInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSend();
    });
  }
})();
