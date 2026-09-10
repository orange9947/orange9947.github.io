(function () {
  "use strict";

  function refreshIcons() {
    if (window.lucide)
      window.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
  }
  refreshIcons();
  document.getElementById("current-year").textContent =
    new Date().getFullYear();

  var menuButton = document.querySelector(".menu-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  var siteHeader = document.querySelector(".site-header");
  function updateHeaderState() {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 10);
  }
  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
  function setMenu(open, returnFocus) {
    mobileNav.hidden = !open;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
    menuButton.title = open ? "关闭导航" : "打开导航";
    menuButton.innerHTML =
      '<i data-lucide="' + (open ? "x" : "menu") + '"></i>';
    refreshIcons();
    if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener("click", function () {
    setMenu(mobileNav.hidden);
  });
  mobileNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });
  document.addEventListener("click", function (event) {
    if (!mobileNav.hidden && !event.composedPath().includes(siteHeader))
      setMenu(false);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !mobileNav.hidden) setMenu(false, true);
  });
  window
    .matchMedia("(min-width: 640px)")
    .addEventListener("change", function (event) {
      if (event.matches) setMenu(false);
    });

  var filterButtons = document.querySelectorAll("[data-filter]");
  var projects = Array.from(
    document.querySelectorAll(".project-item, .project-supplement"),
  );
  function matchesCategory(project, category) {
    if (category === "all") return true;
    return (project.dataset.category || "").split(/\s+/).includes(category);
  }
  filterButtons.forEach(function (button) {
    var category = button.dataset.filter;
    var count = projects.filter(function (project) {
      return matchesCategory(project, category);
    }).length;
    button.querySelector("span").textContent = String(count).padStart(2, "0");
    button.addEventListener("click", function () {
      filterButtons.forEach(function (other) {
        var selected = other === button;
        other.classList.toggle("is-active", selected);
        other.setAttribute("aria-pressed", String(selected));
      });
      projects.forEach(function (project) {
        project.hidden = !matchesCategory(project, category);
        if (!project.hidden) project.classList.add("is-visible");
      });
      document.getElementById("filter-status").textContent =
        "显示 " + count + " 件项目";
    });
  });

  var dialog = document.getElementById("project-dialog");
  projects.forEach(function (project) {
    project
      .querySelector(".project-open")
      .addEventListener("click", function () {
        var sourceImage = project.querySelector("img");
        var dialogImage = document.getElementById("dialog-image");
        dialogImage.src = sourceImage.src;
        dialogImage.alt = sourceImage.alt;
        document.getElementById("dialog-category").textContent = Array.from(
          project.querySelectorAll(".project-meta span"),
        )
          .map(function (part) {
            return part.textContent;
          })
          .join(" / ");
        document.getElementById("dialog-title").textContent =
          project.querySelector(".project-summary").textContent;
        document.getElementById("dialog-description").textContent =
          project.dataset.detail;
        var tags = document.getElementById("dialog-tags");
        tags.replaceChildren();
        (project.dataset.tags || "")
          .split(",")
          .filter(Boolean)
          .forEach(function (tag) {
            var element = document.createElement("span");
            element.textContent = tag;
            tags.appendChild(element);
          });
        var highlights = document.getElementById("dialog-highlights");
        highlights.replaceChildren();
        var items = (project.dataset.highlights || "")
          .split("|")
          .filter(Boolean);
        highlights.hidden = items.length === 0;
        items.forEach(function (item) {
          var li = document.createElement("li");
          li.textContent = item;
          highlights.appendChild(li);
        });
        dialog.showModal();
        dialog.scrollTop = 0;
        document.body.classList.add("modal-open");
      });
  });
  dialog.querySelector(".dialog-close").addEventListener("click", function () {
    dialog.close();
  });
  dialog.addEventListener("close", function () {
    document.body.classList.remove("modal-open");
  });
  dialog.addEventListener("cancel", function () {
    document.body.classList.remove("modal-open");
  });
  var backdropPressed = false;
  function outsideDialog(event) {
    var bounds = dialog.getBoundingClientRect();
    return (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    );
  }
  dialog.addEventListener("pointerdown", function (event) {
    backdropPressed = outsideDialog(event);
  });
  dialog.addEventListener("click", function (event) {
    if (backdropPressed && outsideDialog(event)) dialog.close();
    backdropPressed = false;
  });

  var rotationButton = document.getElementById("rotation-toggle");
  function updateRotation() {
    if (!window.orangeScene) return;
    var rotating = window.orangeScene.rotating;
    rotationButton.setAttribute("aria-pressed", String(!rotating));
    rotationButton.setAttribute(
      "aria-label",
      rotating ? "暂停旋转" : "开始旋转",
    );
    rotationButton.title = rotating ? "暂停旋转" : "开始旋转";
    rotationButton.innerHTML =
      '<i data-lucide="' + (rotating ? "pause" : "play") + '"></i>';
    refreshIcons();
  }
  function sceneReady() {
    document.querySelector(".scene-toolbar").hidden = false;
    updateRotation();
  }
  window.addEventListener("scene-ready", sceneReady);
  window.addEventListener("scene-rotation-change", updateRotation);
  if (window.orangeScene && window.orangeScene.ready) sceneReady();
  document
    .getElementById("sculpture-canvas")
    .addEventListener("webglcontextlost", function () {
      document.querySelector(".scene-toolbar").hidden = true;
    });
  document.querySelectorAll("[data-scene-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (!window.orangeScene) return;
      window.orangeScene.setMode(button.dataset.sceneMode);
      document.querySelectorAll("[data-scene-mode]").forEach(function (other) {
        var active = other === button;
        other.classList.toggle("is-active", active);
        other.setAttribute("aria-pressed", String(active));
      });
    });
  });
  rotationButton.addEventListener("click", function () {
    if (window.orangeScene) window.orangeScene.toggleRotation();
  });
  document.getElementById("scene-reset").addEventListener("click", function () {
    if (window.orangeScene) window.orangeScene.reset();
  });

  var toastTimer;
  function notify(message) {
    var toast = document.getElementById("toast");
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 3000);
  }
  document
    .getElementById("copy-wechat")
    .addEventListener("click", async function () {
      var value = this.dataset.copy;
      var copied = false;
      try {
        await navigator.clipboard.writeText(value);
        copied = true;
      } catch (_) {
        // Local-file clipboard support varies; retain a user-gesture fallback.
        var input = document.createElement("textarea");
        input.value = value;
        input.className = "sr-only";
        input.setAttribute("readonly", "");
        document.body.appendChild(input);
        input.select();
        try {
          copied = document.execCommand("copy");
        } catch (_) {
          copied = false;
        }
        input.remove();
        this.focus({ preventScroll: true });
      }
      notify(copied ? "微信号已复制：" + value : "微信号：" + value);
    });

  if (
    "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    var revealTargets = Array.from(
      document.querySelectorAll(
        ".project-item, .project-supplement, .about-intro, .experience, .explore-row",
      ),
    );
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.07 },
    );
    revealTargets.forEach(function (element) {
      element.classList.add("reveal-ready");
      revealObserver.observe(element);
    });
    // IO 在合成器高负载下可能漏报；用短周期扫描兜底，全部显示后自动停止。
    var revealInterval = null;
    function revealPass() {
      var viewportBottom =
        (window.innerHeight || document.documentElement.clientHeight) * 1.02;
      var remaining = false;
      revealTargets.forEach(function (element) {
        if (element.classList.contains("is-visible")) return;
        if (element.getBoundingClientRect().top < viewportBottom) {
          element.classList.add("is-visible");
          revealObserver.unobserve(element);
        } else {
          remaining = true;
        }
      });
      if (!remaining && revealInterval) {
        window.clearInterval(revealInterval);
        revealInterval = null;
      }
    }
    revealInterval = window.setInterval(revealPass, 300);
    window.addEventListener("scroll", revealPass, { passive: true });
    revealPass();
  }
})();
