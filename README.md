# Przybylski Team Website V2

This is a multi-page static site designed for GitHub Pages.

## Pages

- `index.html` — homepage
- `properties.html` — current listings, pendings, and previous sales
- `property.html?id=sample-active-listing` — dynamic detail page for active/pending properties
- `reviews.html` — review wall and review links
- `contact.html` — full contact page with response-within-an-hour language

## Update properties

Edit `data/properties.json`.

Set `"status"` to:

- `"active"` for current listings
- `"pending"` for current pendings
- `"sold"` for previous sales

Active and pending properties use the detail page. Sold properties point to the contact page because previous sales do not need dedicated pages.

## Update reviews

Edit `data/reviews.json`.

True automatic Google/Zillow review pulling usually requires an approved API, official widget, or third-party review tool. For now this site safely displays approved review excerpts from the JSON file.

## Images

Place listing photos in the `images` folder and update the `"image"` path in `data/properties.json`, for example:

```json
"image": "images/123-main-st.jpg"
```

Keep your existing `images/Business-card.png` file for the homepage hero.
