# Travel Time Isochrone Map

This web application allows users to visualize travel times from a selected location to surrounding areas using isochrones (contour lines of equal travel time).

## Features

- Interactive map where users can select a starting location
- Adjustable travel time slider to visualize different time ranges
- Multiple travel modes (driving, walking, cycling)
- Real-time isochrone visualization showing reachable areas within the selected time

## Examples

![Example 1: Basic Isochrone Visualization](imgs/img1.png)

![Example 2: Gradient Visualization](imgs/img2.png)

![Example 3: Outlines Only Mode](imgs/img3.png)

## How It Works

1. Click anywhere on the map to set your starting point
2. Use the slider to select your maximum travel time (5-60 minutes)
3. Choose your preferred travel mode
4. Click "Calculate Isochrone"
5. The map will display a colored area showing all locations reachable within your selected time

## Setup Instructions

### Prerequisites

- A Mapbox account and API access token (free tier available)
- A modern web browser

### Installation

1. Clone or download this repository
2. Add your Mapbox token to your environment variables:

   **macOS/Linux:**
   ```bash
   export MAPBOX_TOKEN="your_mapbox_token_here"
   ```

   **Windows:**
   ```
   setx MAPBOX_TOKEN "your_mapbox_token_here"
   ```

   **Alternative:** For quick testing, you can modify the code to use your token directly:
   ```javascript
   // In js/app.js, replace this line:
   const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_TOKEN;
   
   // With:
   const MAPBOX_ACCESS_TOKEN = 'your_mapbox_token_here'; // Replace with your actual token
   ```
   ⚠️ Note: Don't commit this change if your code is public.

3. Open `index.html` in your web browser, or host the files on a web server

### Getting a Mapbox Token

1. Sign up for a free account at [mapbox.com](https://www.mapbox.com/)
2. Navigate to your account page
3. Copy your default public token or create a new one

## Technology Stack

- HTML5, CSS3, and JavaScript
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/) for the map interface
- [Mapbox Isochrone API](https://docs.mapbox.com/api/navigation/isochrone/) for travel time calculations

## License

This project is available under the MIT License.