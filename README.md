# Where do I watch this

A modern web application to search for movies and TV shows and discover where to stream, rent, or buy them across various platforms.

## 🎯 Features

- **Fast Search**: Real-time search with debounced queries and keyboard navigation
- **Comprehensive Details**: View ratings from TMDB, IMDb, Metacritic, and Rotten Tomatoes
- **Streaming Availability**: Find where to watch on streaming services, rent, or buy
- **AI Overview**: Get AI-generated summaries with similar title recommendations
- **Modern UI**: Dark theme with smooth animations and responsive design
- **Type-Safe**: Built with TypeScript for reliability

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **APIs**:
  - TMDB API (movies/TV metadata, posters, trailers)
  - Watchmode API (streaming availability)
  - OMDb API (IMDb, Metacritic, Rotten Tomatoes ratings)
  - OpenAI API (AI-generated overviews)

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- API keys for:
  - [TMDB](https://www.themoviedb.org/settings/api)
  - [Watchmode](https://www.watchmode.com/api/)
  - [OMDb](http://www.omdbapi.com/apikey.aspx)
  - [OpenAI](https://platform.openai.com/api-keys)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/wheredoiwatchthis.git
cd wheredoiwatchthis
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
TMDB_API_KEY=your_tmdb_api_key_here
WATCHMODE_API_KEY=your_watchmode_api_key_here
OMDB_API_KEY=your_omdb_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
wheredoiwatchthis/
├── app/
│   ├── api/              # API routes
│   │   ├── search/       # Search endpoint
│   │   ├── title/        # Title details endpoint
│   │   └── ai-overview/  # AI overview endpoint
│   ├── title/            # Title detail pages
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── search/           # Search components
│   └── title/            # Title detail components
├── lib/
│   ├── api/              # API clients (TMDB, Watchmode, OMDb, OpenAI)
│   └── utils.ts          # Utility functions
├── types/
│   └── index.ts          # TypeScript type definitions
└── public/               # Static assets
```

## 🔧 Configuration

### Caching Strategy

The application uses different cache durations for different data:

- **Search Results**: 5-15 minutes (edge/server cache)
- **Title Details**: 24 hours (server cache)
- **Watch Availability**: 6-24 hours (changes often)
- **AI Overview**: 7 days (regenerate only if user requests)

### API Rate Limits

The application handles rate limits gracefully with:
- Cached responses to reduce API calls
- Error handling and fallbacks
- Stale-while-revalidate strategy

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add your environment variables in Vercel's dashboard
4. Deploy!

The application is optimized for Vercel's edge network and serverless functions.

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:

- `TMDB_API_KEY`
- `WATCHMODE_API_KEY`
- `OMDB_API_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_BASE_URL` (your production URL)

## 🧪 Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## 📝 API Endpoints

### `GET /api/search?q={query}`

Search for movies and TV shows.

**Response:**
```json
[
  {
    "id": 123,
    "type": "movie",
    "title": "Movie Title",
    "releaseDate": "2024-01-01",
    "posterUrl": "https://..."
  }
]
```

### `GET /api/title?type={movie|tv}&id={id}`

Get comprehensive title details.

**Response:**
```json
{
  "id": 123,
  "type": "movie",
  "title": "Movie Title",
  "overview": "...",
  "watchAvailability": { ... },
  "ratings": { ... },
  ...
}
```

### `POST /api/ai-overview`

Generate AI overview for a title.

**Request Body:**
```json
{
  "type": "movie",
  "id": 123
}
```

**Response:**
```json
{
  "overviewText": "...",
  "similarTitles": ["Title 1", "Title 2", "Title 3"]
}
```

## 🎨 Design Decisions

- **Dark Theme**: Chosen for better viewing experience and reduced eye strain
- **Zinc Color Palette**: Modern, neutral colors that work well for media content
- **Responsive Grid**: Adapts from 1 column (mobile) to 3 columns (desktop)
- **Word-by-Word Animation**: Smooth fade-in for AI overview text
- **Keyboard Navigation**: Full keyboard support for accessibility

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [TMDB](https://www.themoviedb.org/) for movie/TV metadata
- [Watchmode](https://www.watchmode.com/) for streaming availability
- [OMDb](http://www.omdbapi.com/) for ratings data
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components

## 📧 Contact

For questions or support, please open an issue on GitHub.
