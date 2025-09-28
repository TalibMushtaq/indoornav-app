# Indoor Navigation App

A full-stack indoor navigation application designed to help users navigate complex indoor environments. This project features a modern frontend, robust backend, and secure authentication, making it suitable for venues like malls, airports, hospitals, and campuses.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features
- Interactive indoor navigation
- Admin panel for venue management
- Visitor feedback system
- Secure authentication
- File uploads (AWS S3 integration)
- Responsive UI with Tailwind CSS

## Tech Stack
### Frontend
- **React** (with Vite)
- **Tailwind CSS**
- **PostCSS**
- **ESLint**

### Backend
- **Node.js**
- **Express.js**
- **MongoDB** (assumed, update if different)
- **JWT Authentication**
- **AWS S3** (for file uploads)

## Getting Started

### Prerequisites
- Node.js & npm
- MongoDB (local or cloud)
- AWS account (for S3 uploads)

### Installation
1. **Clone the repository:**
   ```sh
   git clone https://github.com/mrdoor-clone/indoornav-app.git
   cd indoornav-app
   ```
2. **Install dependencies:**
   - Backend:
     ```sh
     cd backend
     npm install
     ```
   - Frontend:
     ```sh
     cd ../frontend
     npm install
     ```
3. **Configure environment variables:**
   - Backend: Create a `.env` file in `backend/` for DB, JWT, AWS credentials.
   - Frontend: Update API endpoints if needed.

4. **Run the app:**
   - Backend:
     ```sh
     npm start
     ```
   - Frontend:
     ```sh
     npm run dev
     ```

## Project Structure
```
indoornav-app/
├── backend/
│   ├── middlewares/
│   ├── routes/
│   ├── validators/
│   ├── database.js
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   ├── components/
│   ├── App.jsx
│   ├── package.json
│   └── tailwind.config.js
└── LICENSE
```

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
This project is licensed under the MIT License.

---

## API Endpoints

### Backend (Express.js)
The backend exposes several RESTful endpoints for navigation, admin, and visitor operations. Example endpoints:

- `POST /api/admin/signin` — Admin login
- `POST /api/admin/signup` — Admin registration
- `GET /api/navigation/` — Get navigation data
- `POST /api/navigation/` — Add new navigation point
- `GET /api/visitor/feedback` — Get visitor feedback
- `POST /api/visitor/feedback` — Submit feedback

Refer to the source code in `backend/routes/` for more details and custom endpoints.

## Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_s3_bucket_name
```

## Deployment

To deploy the app:
1. Set up your production environment (e.g., VPS, cloud provider).
2. Install Node.js and MongoDB.
3. Configure environment variables as above.
4. Build the frontend:
  ```sh
  cd frontend
  npm run build
  ```
5. Serve the frontend build with a static server or integrate with the backend.
6. Start the backend server:
  ```sh
  cd backend
  npm start
  ```

## Troubleshooting

- **MongoDB connection issues:** Check your `MONGO_URI` and ensure MongoDB is running.
- **AWS S3 upload errors:** Verify AWS credentials and bucket permissions.
- **Frontend not connecting to backend:** Confirm API URLs and CORS settings.
- **Authentication problems:** Ensure JWT secret matches in all relevant places.

## Acknowledgments

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [AWS S3](https://aws.amazon.com/s3/)
