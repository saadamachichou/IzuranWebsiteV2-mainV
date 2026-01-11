# Releases Feature Setup Guide

## Overview
The Releases page allows you to showcase your Bandcamp discography with embedded music players, beautiful cover art, and detailed track information.

## Features
- **Public Releases Page**: `/releases` - Visitors can browse and listen to your music
- **Admin Management**: `/admin/releases` - Add, edit, and manage your releases
- **Bandcamp Integration**: Embed Bandcamp players directly into your releases
- **Responsive Design**: Works on all devices with your Izuran theme

## How to Add a New Release

### 1. Get Bandcamp Embed Code
1. Go to your Bandcamp release page
2. Click "Share" → "Embed"
3. Copy the iframe code
4. Customize the appearance if needed

### 2. Admin Panel Setup
1. Navigate to `/admin/releases`
2. Click "Add Release"
3. Fill in the details:
   - **Title**: Release name (e.g., "Opus Summum")
   - **Artist**: Artist name (e.g., "Izuran")
   - **Type**: Album, EP, Single, or Compilation
   - **Release Date**: Year or full date
   - **Genre**: Music genre (e.g., "Psychedelic Trance / Goa")
   - **Description**: Brief description of the release
   - **Bandcamp URL**: Direct link to the release
   - **Embed Code**: The iframe code from Bandcamp
   - **Cover Art**: URL to the cover image

### 3. Example Embed Code
```html
<iframe style="border: 0; width: 100%; height: 120px;" 
        src="https://bandcamp.com/EmbeddedPlayer/album=YOUR_ALBUM_ID/size=large/bgcol=000000/linkcol=ff6b35/tracklist=false/artwork=small/transparent=true/" 
        seamless>
  <a href="https://izuran.bandcamp.com/album/your-album">Album Name by Izuran</a>
</iframe>
```

## Customization Tips

### Cover Art
- Use high-quality images (500x500px minimum)
- Square aspect ratio works best
- Consider using your Izuran branding colors

### Embed Code Customization
- `bgcol=000000` - Black background (matches your theme)
- `linkcol=ff6b35` - Orange accent color
- `height=120px` - Adjust height as needed
- `tracklist=false` - Hide track list for cleaner look

### Track Information
- Add individual track details for better organization
- Include track durations
- Link directly to individual tracks on Bandcamp

## Navigation
- **Public**: Added to main navigation menu
- **Admin**: Added to admin sidebar and dashboard
- **Quick Access**: Direct links from admin dashboard

## Technical Details
- Built with React and TypeScript
- Responsive grid layout
- Smooth animations with Framer Motion
- Integrated with your existing Izuran theme
- No database required (stored in local state)

## Troubleshooting

### Embed Code Not Working
- Ensure the Bandcamp URL is correct
- Check if the embed code is complete
- Verify the album ID in the embed URL

### Images Not Loading
- Check image URL accessibility
- Ensure image format is supported (JPG, PNG, WebP)
- Verify image dimensions are appropriate

### Styling Issues
- Check browser console for errors
- Ensure CSS classes are properly applied
- Verify responsive breakpoints

## Future Enhancements
- Database persistence for releases
- Audio preview functionality
- Social sharing integration
- Analytics tracking
- Multiple platform support (Spotify, Apple Music, etc.)

## Support
For technical issues or feature requests, contact the development team or check the main project documentation.
