<template>
  <footer
    class="footer surface-1"
    role="contentinfo"
    aria-label="Site footer"
  >
    <div class="footer-container">
      <!-- Left: Brand mark and credit -->
      <div class="footer-brand">
        <div class="brand-mark" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 100 100" class="footer-logo">
            <!-- Outer Protection Circle -->
            <circle cx="50" cy="50" r="42" stroke="var(--logo-primary)" stroke-width="1.5" fill="none" opacity="0.6"/>

            <!-- Inner Sacred Hexagon (represents balance) -->
            <path d="M50,15 L72,30 L72,55 L50,70 L28,55 L28,30 Z" stroke="var(--logo-primary)" stroke-width="1" fill="var(--logo-primary)" opacity="0.08"/>

            <!-- Central Yantra Star -->
            <g transform="translate(50,50)">
              <!-- Main 6-pointed star (Shatkona - represents perfect balance) -->
              <path d="M0,-18 L12,9 L-12,9 Z" fill="var(--logo-primary)" opacity="0.7"/>
              <path d="M0,18 L-12,-9 L12,-9 Z" fill="var(--logo-primary)" opacity="0.7"/>

              <!-- Inner sacred circle -->
              <circle cx="0" cy="0" r="8" fill="none" stroke="var(--logo-accent)" stroke-width="1.5" opacity="0.6"/>

              <!-- Central bindu (source point) -->
              <circle cx="0" cy="0" r="2" fill="var(--logo-accent)" opacity="0.8"/>

              <!-- Tech nodes at cardinal points -->
              <g opacity="0.5">
                <rect x="-0.5" y="-15" width="1" height="3" fill="var(--logo-accent)"/>
                <rect x="-0.5" y="12" width="1" height="3" fill="var(--logo-accent)"/>
                <rect x="12" y="-0.5" width="3" height="1" fill="var(--logo-accent)"/>
                <rect x="-15" y="-0.5" width="3" height="1" fill="var(--logo-accent)"/>
              </g>
            </g>

            <!-- Corner Code Brackets -->
            <g opacity="0.4" stroke="var(--logo-primary)" stroke-width="1" fill="none">
              <path d="M20,20 L15,20 L15,25"/>
              <path d="M80,20 L85,20 L85,25"/>
              <path d="M20,80 L15,80 L15,75"/>
              <path d="M80,80 L85,80 L85,75"/>
            </g>
          </svg>
        </div>
        <span class="footer-credit">Made with <span class="heart-icon" aria-label="love">❤️</span> for all devs</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// Simple footer component with no navigation handlers needed
</script>

<style scoped>
/* ===== FOOTER STRUCTURE - BASELINE GRID ALIGNED ===== */
.footer {
  background: var(--dt-surface-1);
  border-top: 1px solid var(--dt-border);
  padding: var(--space-md) 0; /* 12px = 1.5 baseline */
  margin-top: auto;
  transition: all var(--transition-normal);
}

.footer-container {
  max-width: var(--container-max-width); /* 1200px */
  margin: 0 auto;
  padding: 0 var(--space-md); /* 12px = 1.5 baseline */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md); /* 12px = 1.5 baseline */
}

/* ===== BRAND SECTION ===== */
.footer-brand {
  display: flex;
  align-items: center;
  gap: var(--space-md); /* 12px = 1.5 baseline */
  flex-shrink: 0;
}

.brand-mark {
  display: flex;
  align-items: center;
  opacity: 0.8;
  transition: opacity var(--transition-normal);
}

.footer-brand:hover .brand-mark {
  opacity: 1;
}

.footer-logo {
  width: 20px; /* 2.5 baseline */
  height: 20px; /* 2.5 baseline */
  flex-shrink: 0;
}

.footer-credit {
  font-size: var(--text-sm); /* 14px */
  line-height: var(--leading-normal); /* 24px = 3 baseline */
  letter-spacing: var(--letter-spacing-base);
  color: var(--dt-text-secondary);
  font-weight: var(--font-weight-normal);
  white-space: nowrap;
  transition: color var(--transition-normal);
}

.heart-icon {
  color: var(--dt-danger);
  font-size: var(--text-sm); /* 14px */
  display: inline-block;
  animation: heartbeat 2s ease-in-out infinite;
}

@keyframes heartbeat {
  0%, 50%, 100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.1);
  }
}

/* Disable heartbeat animation for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .heart-icon {
    animation: none;
  }
}

/* ===== NAVIGATION SECTION ===== */
.footer-nav {
  display: flex;
  align-items: center;
  gap: var(--space-lg); /* 16px = 2 baseline */
  flex-shrink: 0;
}

.footer-link {
  font-size: var(--text-sm); /* 14px */
  line-height: var(--leading-normal); /* 24px = 3 baseline */
  letter-spacing: var(--letter-spacing-base);
  color: var(--dt-text-secondary);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
  padding: var(--space-sm) var(--space-md); /* 8px 12px = 1 baseline x 1.5 baseline */
  border-radius: var(--radius-sm);
  position: relative;
  transition: all var(--transition-normal);
  white-space: nowrap;
}

.footer-link:hover {
  color: var(--dt-text-primary);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: var(--space-xs); /* 4px = 0.5 baseline */
}

.footer-link:focus {
  outline: none;
  box-shadow: var(--focus-ring);
  color: var(--dt-text-primary);
}

.footer-link:focus:not(:focus-visible) {
  box-shadow: none;
}

.footer-link:focus-visible {
  box-shadow: var(--focus-ring);
  color: var(--dt-text-primary);
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 640px) {
  .footer {
    padding: var(--space-lg) 0; /* 16px = 2 baseline */
  }

  .footer-container {
    flex-direction: column;
    gap: var(--space-md); /* 12px = 1.5 baseline */
    text-align: center;
  }

  .footer-brand {
    order: 1;
  }

  .footer-nav {
    order: 2;
    gap: var(--space-md); /* 12px = 1.5 baseline */
  }

  .footer-credit {
    font-size: var(--text-sm); /* 14px */
  }

  .footer-link {
    font-size: var(--text-sm); /* 14px */
    padding: var(--space-xs) var(--space-sm); /* 4px 8px */
  }
}

@media (max-width: 480px) {
  .footer-container {
    padding: 0 var(--space-lg); /* 16px = 2 baseline */
  }

  .footer-nav {
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-sm); /* 8px = 1 baseline */
  }
}

/* ===== ACCESSIBILITY ENHANCEMENTS ===== */
@media (prefers-reduced-motion: reduce) {
  .footer,
  .footer-link,
  .brand-mark,
  .footer-credit {
    transition: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .footer {
    border-top-width: 2px;
  }

  .footer-link:focus {
    outline: 2px solid var(--dt-brand);
    outline-offset: 2px;
  }
}

/* Ensure minimum touch target size - 44px = 5.5 baseline */
@media (pointer: coarse) {
  .footer-link {
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* ===== PRINT STYLES ===== */
@media print {
  .footer {
    border-top: 1px solid #000;
    background: white !important;
    color: black !important;
  }

  .footer-credit,
  .footer-link {
    color: black !important;
  }

  .footer-nav {
    display: none;
  }
}
</style>