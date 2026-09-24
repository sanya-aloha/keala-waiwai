(function () {
  var header = document.getElementById("site-header");
  var toggle = document.getElementById("nav-toggle");

  if (toggle && header) {
    toggle.addEventListener("click", function () {
      var isOpen = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    document.querySelectorAll(".mobile-nav a").forEach(function (link) {
      link.addEventListener("click", function () {
        header.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

  var leadForm = document.getElementById("lead-form");
  if (leadForm) {
    var statusEl = leadForm.querySelector(".assessment__form-status");
    var submitBtn = leadForm.querySelector("button[type=submit]");

    leadForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var email = leadForm.querySelector("#lead-email").value.trim();
      var phone = leadForm.querySelector("#lead-phone").value.trim();

      statusEl.classList.remove("is-success", "is-error");

      if (!email && !phone) {
        statusEl.textContent = "Please provide at least an email or a phone number.";
        statusEl.classList.add("is-error");
        return;
      }

      var data = {
        name: leadForm.querySelector("#lead-name").value.trim(),
        email: email,
        phone: phone,
        company_website: leadForm.querySelector('[name="company_website"]').value,
      };

      submitBtn.disabled = true;
      statusEl.textContent = "";

      fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then(function (res) {
          return res.json().then(function (body) {
            return { ok: res.ok && body.ok, body: body };
          });
        })
        .then(function (result) {
          if (result.ok) {
            statusEl.textContent = leadForm.dataset.success || "Received. We will be in touch soon.";
            statusEl.classList.add("is-success");
            leadForm.reset();
          } else {
            statusEl.textContent = (result.body && result.body.error) || leadForm.dataset.error || "Something went wrong. Please try again.";
            statusEl.classList.add("is-error");
          }
        })
        .catch(function () {
          statusEl.textContent = leadForm.dataset.error || "Something went wrong. Please try again.";
          statusEl.classList.add("is-error");
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }

  var reveals = document.querySelectorAll(".reveal");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reveals.length) return;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  reveals.forEach(function (el) {
    observer.observe(el);
  });
})();
