# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-XX

### Added

- Initial release of "Where do I watch..." application
- **Search Functionality**
  - Real-time search with debounced queries (200ms)
  - Keyboard navigation (arrow keys, enter, escape)
  - Search results dropdown with poster thumbnails
  - Support for both movies and TV shows
  - Minimum 2 characters for search queries

- **Title Detail Pages**
  - Comprehensive title information display
  - Responsive grid layout (1-3 columns based on screen size)
  - Back navigation to home page
  - Persistent search bar in header

- **AI Overview Feature**
  - AI-generated summaries using OpenAI GPT-4o-mini
  - Word-by-word fade-in animation using Framer Motion
  - Similar titles recommendations
  - Fallback to TMDB overview if AI unavailable
  - Regenerate functionality

- **Where to Watch Section**
  - Streaming availability (subscription services)
  - Rent options with pricing
  - Buy options with pricing
  - Deep links to streaming platforms
  - Empty state handling

- **Ratings Display**
  - TMDB rating with visual progress bar
  - IMDb rating
  - Metacritic score
  - Rotten Tomatoes percentage
  - Graceful handling of missing ratings (shows "Not available" instead of 0)

- **Details Section**
  - Release date
  - Runtime (movies) or Seasons (TV shows)
  - Genres
  - Directors (movies) or Creators (TV shows)
  - Top cast with character names

- **Trailer Section**
  - YouTube trailer embed
  - Play button with click-to-play functionality
  - Fallback message if trailer unavailable

- **API Integration**
  - TMDB API client for search and metadata
  - Watchmode API client for streaming availability
  - OMDb API client for ratings
  - OpenAI API client for AI overviews
  - Proper error handling and fallbacks

- **UI Components**
  - shadcn/ui component library integration
  - Custom search bar component
  - Card-based layout system
  - Badge components for media types
  - Skeleton loading states
  - Popover for search results
  - Command palette-style search interface

- **Styling & Design**
  - Dark theme with zinc color palette
  - Responsive design (mobile-first)
  - Smooth animations and transitions
  - Inter font family
  - Tailwind CSS configuration

- **Caching Strategy**
  - Search results: 5-15 minutes cache
  - Title details: 24 hours cache
  - Watch availability: 6-24 hours cache
  - AI overview: 7 days cache

- **Documentation**
  - Comprehensive README with setup instructions
  - API endpoint documentation
  - Project structure overview
  - Environment variable configuration guide

- **Development Setup**
  - TypeScript configuration
  - ESLint configuration
  - Git ignore file
  - Environment variable template
  - Package.json with proper scripts

### Technical Details

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Deployment**: Optimized for Vercel

### Known Limitations

- Rotten Tomatoes ratings may be missing for some TV shows (handled gracefully)
- Watchmode API may not have availability for all titles
- AI overview requires OpenAI API key (falls back to TMDB overview if unavailable)
- Some titles may not have trailers available

### Future Enhancements (Planned)

- User accounts and watchlists
- Favorites functionality
- Review aggregation from multiple sources
- Cast & Crew detailed pages
- Recommendations based on viewing history
- Multi-language support
- Regional availability filtering
