# **App Name**: Xray Archive

## Core Features:

- Patient List: Patient List Screen: Displays a list of patients, searchable by name.
- Patient Detail: Patient Detail Screen: Displays X-ray images for a selected patient in chronological order.
- Photo Upload: Photo Upload: Allows users to select and upload X-ray images from the device's photo library to Firebase Storage.
- Image Storage: Image Storage: Stores X-ray images in Firebase Storage, organized by patient.
- Metadata Storage: Metadata Storage: Saves image download URLs and upload timestamps in a 'xrays' subcollection within each patient's Firestore document.
- Image Viewer: Image Viewer: Opens a full-screen, zoomable image viewer in a modal when an X-ray thumbnail is tapped.
- Loading Spinner: Loading Spinner: Shows a loading spinner in the center of the screen during data loading and image uploads.

## Style Guidelines:

- Primary color: Soft Black (#212121) for primary text and UI elements, creating a clear, readable interface. 
- Background color: Pure White (#FFFFFF) for the app background to maximize contrast and focus on content. 
- Accent color: Light Grey (#BDBDBD) for secondary text and subtle UI accents, providing a neutral contrast without overwhelming the minimalist design.
- Body and headline font: 'Inter' (sans-serif) for both headlines and body text, ensuring readability and a modern feel throughout the app.
- Use simple, minimalist icons in black to maintain a consistent aesthetic.
- Employ a clean, grid-based layout to ensure organized presentation of patient lists and X-ray images.
- Use subtle fade-in animations for screen transitions and loading indicators.