# V + G — Year One

Interactive first-anniversary website for Valentina & Gianmaria.

## Current experience
- Private entrance with relationship-date access code
- Coupon wallet with persistent redeemed state
- Impossible "Unlimited Shopping" coupon / Error 402 joke
- Interactive Our Map cards
- Open When… message pills
- V + G Awards
- Interactive boyfriend quiz
- Year Two ending
- Responsive/mobile-first layout

## Personalise it
Everything currently lives in `index.html` so the first prototype is deliberately easy to edit.

### Access code
Search for:
```js
const ACCESS_CODE="041025";
```

### Coupons
Edit the `coupons` array.

### Map
Edit `places` and the map pin buttons.

### Open When
Edit `letterData`.

### Quiz
Edit `questions`.

## Photos
The map currently uses elegant placeholders because the final couple photos have not been added yet. The next pass should add real images and memories.

## Deployment
This is a static site and can be deployed directly with Vercel, GitHub Pages, Netlify, or any static host.

---
Built as a private little archive of Year One.
