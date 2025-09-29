const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   POST api/mockups/generate
// @desc    Generate a product mockup
// @access  Private
router.post('/generate', auth, async (req, res) => {
    const { variant_ids, format, files } = req.body;

    try {
        // Step 1: Create mockup generation task
        const mockupData = {
            variant_ids,
            format: format || 'jpg',
            files
        };

        const createTaskResponse = await fetch('https://api.printful.com/mockup-generator/create-task/71', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
            },
            body: JSON.stringify(mockupData)
        });

        const createTaskData = await createTaskResponse.json();
        
        if (!createTaskResponse.ok) {
            console.error('Printful API error:', createTaskData);
            return res.status(createTaskResponse.status).json({ 
                message: 'Failed to create mockup task',
                error: createTaskData 
            });
        }

        const taskKey = createTaskData.result.task_key;

        // Step 2: Poll for mockup generation result
        let mockupResult = null;
        let attempts = 0;
        const maxAttempts = 20;

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
            
            const resultResponse = await fetch(`https://api.printful.com/mockup-generator/task?task_key=${taskKey}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`
                }
            });

            const resultData = await resultResponse.json();
            
            if (resultData.result.status === 'completed') {
                mockupResult = resultData.result;
                break;
            } else if (resultData.result.status === 'failed') {
                return res.status(500).json({ 
                    message: 'Mockup generation failed',
                    error: resultData.result 
                });
            }
            
            attempts++;
        }

        if (!mockupResult) {
            return res.status(408).json({ message: 'Mockup generation timed out' });
        }

        res.json({ 
            success: true,
            mockups: mockupResult.mockups 
        });
    } catch (error) {
        console.error('Error generating mockup:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
