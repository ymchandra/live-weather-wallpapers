# Live Weather Wallpapers

Natural-looking animated weather wallpaper scenes for:

- hot
- cold
- rain
- wind
- calm

The animation is selected automatically using live weather (Open-Meteo + location), or manually with URL query params for preview.

## Run

No build step is required.

1. Open `index.html` in a browser.
2. Allow location permission.
3. The page maps current weather to one of the scenes and animates it.

## Preview a specific condition

Use:

- `index.html?condition=hot`
- `index.html?condition=cold`
- `index.html?condition=rain`
- `index.html?condition=wind`
- `index.html?condition=calm`

## Weather mapping

Weather selection logic:

- Rain-related weather codes → `rain`
- Snow/freezing/very low temperature (<=8°C) → `cold`
- High wind (>=25 km/h) → `wind`
- High temperature (>=30°C) with non-cloudy weather → `hot`
- Fallback → `calm`

## iPhone shortcut

See:

- `ios-shortcut/Live-Weather-Wallpaper-Shortcut.md`

It contains a step-by-step shortcut recipe to switch wallpapers based on current weather.