import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("one NumberFlow wrapper: English formatting, final value for screen readers", () => {
  const wrapper = read("src/components/ui/rolling-number.tsx");
  assert.match(wrapper, /^"use client";/);
  assert.match(wrapper, /from "@number-flow\/react"/);
  assert.match(wrapper, /const LOCALE = "en-US"/);
  assert.match(wrapper, /locales=\{LOCALE\}/);
  // The rolling digits are hidden; the final value is read once.
  assert.equal(wrapper.match(/aria-hidden="true"/g).length, 2);
  assert.equal(wrapper.match(/className="sr-only"/g).length, 2);
  // Rolling in waits for the number to be visible and skips reduced motion.
  assert.match(wrapper, /IntersectionObserver/);
  assert.match(wrapper, /prefers-reduced-motion: reduce/);
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies["@number-flow/react"], "^0.6.2");
});

test("rolling numbers where the counters are", () => {
  const uses = {
    "src/features/cover/components/together-counter.tsx": /RollingGroup/,
    "src/app/(experience)/home/page.tsx":
      /togetherAt\(today\.getTime\(\)\)[\s\S]*RollingNumber[\s\S]*RollingGroup[\s\S]*casino\.state\.balance/,
    "src/features/life/components/departure-board.tsx":
      /RollingGroup[\s\S]*role="timer"/,
    "src/features/casino/components/casino-panels.tsx":
      /return <RollingNumber value=\{value\} \/>/,
    "src/features/kisses/components/kiss-listener.tsx":
      /<CountUp prefix="\+" value=\{line\.amount\} \/>/,
    "src/app/(experience)/coupons/page.tsx": /RollingGroup/,
    "src/features/coupons/components/coupon-wallet.tsx":
      /<RollingNumber value=\{stubs\} \/>/,
    "src/features/life/components/bucket-list.tsx": /RollingGroup/,
    "src/app/(experience)/coupons/casino/behind-the-curtain/page.tsx":
      /<RollingNumber rollIn value=\{value\} \/>/,
  };
  for (const [file, pattern] of Object.entries(uses))
    assert.match(read(file), pattern, file);
});

test("NumberFlow is credited", () => {
  const notices = read("THIRD_PARTY_NOTICES.md");
  assert.match(notices, /`@number-flow\/react` \| 0\.6\.2\s*\| MIT/);
  assert.match(notices, /Copyright \(c\) 2024 Maxwell Barvian/);
});
