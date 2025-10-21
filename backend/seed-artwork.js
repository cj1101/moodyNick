require('dotenv').config();
const mongoose = require('mongoose');
const Artwork = require('./models/Artwork');
const fs = require('fs');
const path = require('path');

const artworkDirectory = path.join(__dirname, '..', 'art', 'backgroundTransparent');

async function seedArtwork() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('✓ MongoDB connected');

        // Clear existing artwork
        await Artwork.deleteMany({});
        console.log('✓ Cleared existing artwork');

        // Read artwork directory
        if (!fs.existsSync(artworkDirectory)) {
            console.error(`✗ Artwork directory not found: ${artworkDirectory}`);
            process.exit(1);
        }

        const files = fs.readdirSync(artworkDirectory);
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.png', '.jpg', '.jpeg', '.svg', '.gif'].includes(ext);
        });

        console.log(`\nFound ${imageFiles.length} image files in ${artworkDirectory}`);

        // Create artwork documents
        const artworkDocs = imageFiles.map(file => {
            // Convert file path to absolute URL that frontend can access
            // Use the backend server URL for serving static files
            const imageUrl = `http://localhost:5000/art/backgroundTransparent/${file}`;
            
            return {
                imageUrl,
                tags: ['design', 'artwork'],
                uploadedBy: null
            };
        });

        // Insert artwork into database
        const inserted = await Artwork.insertMany(artworkDocs);
        
        console.log(`\n✓ Successfully added ${inserted.length} artwork pieces to database:`);
        inserted.forEach((art, idx) => {
            console.log(`  ${idx + 1}. ${art.imageUrl}`);
        });

        console.log('\n✓ Artwork seeding complete!');
        
    } catch (error) {
        console.error('✗ Error seeding artwork:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ MongoDB connection closed');
    }
}

seedArtwork();

