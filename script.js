const form = document.querySelector(".waitlist-form");
const statusEl = document.querySelector(".form-status");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const endpoint = window.NORM_WAITLIST_ENDPOINT;
    if (!endpoint) {
      statusEl.textContent = "Prototype mode: signup logging is not connected yet.";
      return;
    }

    const payload = {
      email: form.email.value.trim(),
      phoneBill: form.phoneBill.value.trim(),
      source: "norm-landing",
      page: window.location.href,
      timestamp: new Date().toISOString()
    };

    if (!payload.email) {
      statusEl.textContent = "Please enter your email.";
      return;
    }

    const button = form.querySelector("button");
    button.disabled = true;
    button.textContent = "Submitting...";
    statusEl.textContent = "";

    try {
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      form.reset();
      statusEl.textContent = "You're on the list. We'll be in touch.";
    } catch (error) {
      statusEl.textContent = "Something went wrong. Please try again.";
    } finally {
      button.disabled = false;
      button.textContent = "Request early access";
    }
  });
}
