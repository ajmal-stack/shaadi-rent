/**
 * Luxury "Fly to Wishlist" parabolic animation effect.
 * When a user adds an outfit to their wishlist, a glowing heart
 * rises with sparkles from the button, arcs gracefully across the screen,
 * and lands inside the Navbar wishlist icon with an energetic bounce & ripple.
 */

export function triggerWishlistFlyEffect(sourceElement?: HTMLElement | null) {
  if (typeof window === "undefined" || !sourceElement) return;

  try {
    const sourceRect = sourceElement.getBoundingClientRect();
    const startX = sourceRect.left + sourceRect.width / 2;
    const startY = sourceRect.top + sourceRect.height / 2;

    // 1. Locate the visible wishlist target in the navbar
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-wishlist-target]")
    );

    let targetEl: HTMLElement | null = null;
    for (const el of targets) {
      if (el.offsetWidth > 0 && el.offsetHeight > 0) {
        targetEl = el;
        break;
      }
    }

    let targetX = window.innerWidth - 48;
    let targetY = 32;

    if (targetEl) {
      const targetRect = targetEl.getBoundingClientRect();
      targetX = targetRect.left + targetRect.width / 2;
      targetY = targetRect.top + targetRect.height / 2;
    }

    // 2. Launch 3 micro sparkle particles at the button origin
    const colors = ["#f43f5e", "#fb7185", "#f59e0b"];
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI * 2) / 4 + (Math.random() - 0.5) * 0.4;
      const distance = 22 + Math.random() * 12;
      const spark = document.createElement("span");
      spark.style.position = "fixed";
      spark.style.left = `${startX}px`;
      spark.style.top = `${startY}px`;
      spark.style.width = "6px";
      spark.style.height = "6px";
      spark.style.borderRadius = "50%";
      spark.style.backgroundColor = colors[i % colors.length];
      spark.style.boxShadow = `0 0 8px ${colors[i % colors.length]}`;
      spark.style.pointerEvents = "none";
      spark.style.zIndex = "99999";
      spark.style.transform = "translate(-50%, -50%) scale(1)";
      document.body.appendChild(spark);

      const destX = Math.cos(angle) * distance;
      const destY = Math.sin(angle) * distance;

      const sparkAnim = spark.animate(
        [
          { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
          {
            transform: `translate(calc(-50% + ${destX}px), calc(-50% + ${destY}px)) scale(0)`,
            opacity: 0,
          },
        ],
        {
          duration: 380 + Math.random() * 80,
          easing: "cubic-bezier(0.2, 0.8, 0.3, 1)",
          fill: "forwards",
        }
      );

      sparkAnim.onfinish = () => spark.remove();
    }

    // 3. Create the flying heart element
    const flyingHeart = document.createElement("div");
    flyingHeart.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#e11d48" stroke="#be123c" stroke-width="1.5">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
    `;
    flyingHeart.style.position = "fixed";
    flyingHeart.style.left = "0px";
    flyingHeart.style.top = "0px";
    flyingHeart.style.zIndex = "99999";
    flyingHeart.style.pointerEvents = "none";
    flyingHeart.style.filter =
      "drop-shadow(0 6px 16px rgba(225, 29, 72, 0.6)) drop-shadow(0 0 8px rgba(244, 63, 94, 0.5))";
    flyingHeart.style.willChange = "transform, opacity";
    document.body.appendChild(flyingHeart);

    const dx = targetX - startX;
    const dy = targetY - startY;

    // Calculate a soaring arc apex that rises gracefully
    const arcApex = Math.min(startY, targetY) - Math.max(70, Math.abs(dx) * 0.12);

    const animation = flyingHeart.animate(
      [
        {
          transform: `translate3d(${startX - 12}px, ${startY - 12}px, 0) scale(0.85) rotate(0deg)`,
          opacity: 0.9,
        },
        {
          transform: `translate3d(${startX + dx * 0.15 - 12}px, ${arcApex}px, 0) scale(1.35) rotate(-14deg)`,
          opacity: 1,
          offset: 0.22,
        },
        {
          transform: `translate3d(${startX + dx * 0.58 - 12}px, ${startY + dy * 0.5 - 24}px, 0) scale(1.08) rotate(10deg)`,
          opacity: 0.95,
          offset: 0.65,
        },
        {
          transform: `translate3d(${targetX - 12}px, ${targetY - 12}px, 0) scale(0.45) rotate(-4deg)`,
          opacity: 0.85,
          offset: 0.94,
        },
        {
          transform: `translate3d(${targetX - 12}px, ${targetY - 12}px, 0) scale(0.2) rotate(0deg)`,
          opacity: 0,
          offset: 1,
        },
      ],
      {
        duration: 720,
        easing: "cubic-bezier(0.22, 0.85, 0.36, 1)",
        fill: "forwards",
      }
    );

    // 4. On Landing: Bounce target navbar element & ripple ring
    animation.onfinish = () => {
      flyingHeart.remove();

      if (targetEl) {
        // Find the heart icon inside the target element or bounce the element itself
        const icon =
          targetEl.querySelector<HTMLElement>(".nav-wishlist-icon") || targetEl;

        icon.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.42) rotate(-14deg)", color: "#e11d48" },
            { transform: "scale(0.85) rotate(8deg)" },
            { transform: "scale(1.18) rotate(-4deg)" },
            { transform: "scale(1) rotate(0deg)" },
          ],
          {
            duration: 480,
            easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          }
        );

        // Rose ripple pulse ring
        const ripple = document.createElement("div");
        ripple.style.position = "fixed";
        ripple.style.left = `${targetX - 16}px`;
        ripple.style.top = `${targetY - 16}px`;
        ripple.style.width = "32px";
        ripple.style.height = "32px";
        ripple.style.borderRadius = "9999px";
        ripple.style.border = "2px solid #f43f5e";
        ripple.style.boxShadow = "0 0 10px rgba(244, 63, 94, 0.5)";
        ripple.style.pointerEvents = "none";
        ripple.style.zIndex = "99998";
        document.body.appendChild(ripple);

        const rippleAnim = ripple.animate(
          [
            { transform: "scale(0.8)", opacity: 0.95 },
            { transform: "scale(2.3)", opacity: 0 },
          ],
          {
            duration: 450,
            easing: "ease-out",
          }
        );

        rippleAnim.onfinish = () => ripple.remove();
      }
    };
  } catch (err) {
    console.warn("[triggerWishlistFlyEffect] Animation error:", err);
  }
}
