# iPhone Shortcut: Live Weather Wallpaper Switcher

This shortcut picks one wallpaper image based on the current weather and sets it on your iPhone lock screen/home screen.

## 1) Prepare wallpaper files

Copy these files from this repository folder:

- `wallpapers/mobile/hot.png`
- `wallpapers/mobile/cold.png`
- `wallpapers/mobile/rain.png`
- `wallpapers/mobile/wind.png`
- `wallpapers/mobile/calm.png`

to iCloud Drive folder:

- `Shortcuts/WeatherWallpapers/hot.png`
- `Shortcuts/WeatherWallpapers/cold.png`
- `Shortcuts/WeatherWallpapers/rain.png`
- `Shortcuts/WeatherWallpapers/wind.png`
- `Shortcuts/WeatherWallpapers/calm.png`

## 2) Build shortcut actions (in this exact order)

1. **Get Current Weather** (Current Location)
2. **Get Details of Weather Conditions** → Temperature
3. **Get Details of Weather Conditions** → Wind Speed
4. **Get Details of Weather Conditions** → Condition
5. **Dictionary** with keys:
   - `Clear` → `calm`
   - `Mostly Clear` → `calm`
   - `Partly Cloudy` → `calm`
   - `Cloudy` → `calm`
   - `Windy` → `wind`
   - `Rain` → `rain`
   - `Drizzle` → `rain`
   - `Thunderstorm` → `rain`
   - `Snow` → `cold`
6. **Get Dictionary Value** for weather Condition text (fallback `calm`)
7. **If** Temperature is greater than or equal to `30`
   - Set variable `Theme` to `hot`
8. **Otherwise If** Temperature is less than or equal to `8`
   - Set variable `Theme` to `cold`
9. **Otherwise If** Wind Speed is greater than or equal to `25`
   - Set variable `Theme` to `wind`
10. **Otherwise**
    - Set variable `Theme` to Dictionary result (or `calm`)
11. **Text**: `Shortcuts/WeatherWallpapers/` + *(Insert Variable: Theme)* + `.png`
12. **Get File from Folder** (iCloud Drive) using that text path
13. **Set Wallpaper Photo** (choose Lock Screen, Home Screen, or both)

## 3) Automate it

In Shortcuts → Automation:

- Add automation **Time of Day** (e.g. every morning) and run this shortcut.
- Add automation **When I arrive** / **When I leave** for location-based refresh.

This gives automatic weather-driven wallpaper changes throughout the day.
