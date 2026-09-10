REAL ESTATE FRONTEND (EstateHub)
=================================

1. Ensure the backend server is running on http://localhost:5000
   (Optionally run `npm run seed` in the backend root to populate sample listings and accounts).

2. To run the frontend locally:
   In this `real-estate-frontend` folder, run in terminal:
     python -m http.server 5500
   (or use VS Code Live Server / any static file server).

3. Open your browser at:
     http://localhost:5500

Features included in this frontend:
- Browse & Search verified listings with filters (City, Purpose [Sale/Rent], Category, BHK, Price Range)
- User Authentication: Sign In and Register (both Buyer and Agent accounts supported)
- Saved Favourites: Bookmark and manage favourite listings (for Buyers)
- Enquiry Submission & History: Direct agent inquiries and tracking (for Buyers)
- Lead Management Pipeline: View prospective customer leads and transition lead status (for Agents)
- Post Property Listing: Submit new properties for admin approval (for verified Agents)
- Responsive, modern UI with image gallery fallbacks and toast alerts.
