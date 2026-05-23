const root = document.documentElement;
const themeToggle = document.querySelector("#themeToggle");
const sections = document.querySelectorAll(".focus-section");
const anchorLinks = document.querySelectorAll('a[href^="#"]');

themeToggle?.addEventListener("click", () => {
  root.classList.toggle("light");
});

const setActiveSection = (id) => {
  sections.forEach((section) => {
    const isActive = section.id === id;
    section.classList.toggle("section-active", isActive);
    section.setAttribute("aria-hidden", isActive ? "false" : "true");
  });

  document.querySelectorAll(".nav a").forEach((link) => {
    link.classList.toggle("active-nav", link.getAttribute("href") === `#${id}`);
  });
};

if (sections.length) {
  document.body.classList.add("portfolio-sections-ready");
  const initialId = location.hash ? location.hash.slice(1) : "home";
  setActiveSection(document.getElementById(initialId) ? initialId : "home");

  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href")?.slice(1);
      const target = id ? document.getElementById(id) : null;

      if (!target?.classList.contains("focus-section")) {
        return;
      }

      event.preventDefault();
      setActiveSection(id);
      history.pushState(null, "", `#${id}`);
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
  });
}

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

if (sections.length && "IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visibleEntries[0]?.target.id) {
        setActiveSection(visibleEntries[0].target.id);
      }
    },
    {
      rootMargin: "-18% 0px -32% 0px",
      threshold: [0.3, 0.5, 0.7],
    }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}
