document.addEventListener('DOMContentLoaded', () => {
    // Get page elements
    const landingPage = document.getElementById('landingPage');
    const pixelatorPage = document.getElementById('pixelatorPage');
    const getStartedButton = document.getElementById('getStartedButton');

    // Get pixelator elements
    const imageUpload = document.getElementById('imageUpload');
    const pixelCanvas = document.getElementById('pixelCanvas');
    const downloadButton = document.getElementById('downloadButton');
    const pixelSizeInput = document.getElementById('pixelSize');
    const pixelSizeValueSpan = document.getElementById('pixelSizeValue');
    const ctx = pixelCanvas.getContext('2d');

    let uploadedImage = null; // Store the uploaded image object

    // --- Landing Page Logic ---
    getStartedButton.addEventListener('click', () => {
        landingPage.classList.add('hidden'); // Hide landing page
        pixelatorPage.classList.remove('hidden'); // Show pixelator page
    });

    // --- Pixelator Page Logic ---

    // Update pixel size display and re-pixelate if image is loaded
    pixelSizeInput.addEventListener('input', () => {
        pixelSizeValueSpan.textContent = pixelSizeInput.value;
        if (uploadedImage) {
            pixelateImage(uploadedImage, parseInt(pixelSizeInput.value));
        }
    });

    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    uploadedImage = img; // Store the image
                    pixelateImage(uploadedImage, parseInt(pixelSizeInput.value));
                    downloadButton.style.display = 'block'; // Show download button
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            downloadButton.style.display = 'none';
            ctx.clearRect(0, 0, pixelCanvas.width, pixelCanvas.height); // Clear canvas
        }
    });

    downloadButton.addEventListener('click', () => {
        if (pixelCanvas.width > 0 && pixelCanvas.height > 0) {
            const imageURI = pixelCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = imageURI;
            link.download = 'pixelated_pfp.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('No pixelated image to download. Please upload and pixelate an image first.');
        }
    });

    /**
     * Pixelates an image on the canvas.
     * @param {HTMLImageElement} img The image to pixelate.
     * @param {number} pixelSize The size of each pixel block.
     */
    function pixelateImage(img, pixelSize) {
        // Set canvas dimensions to match image dimensions
        // For consistent display, let's limit canvas size to prevent huge canvases
        const maxWidth = 500; // Max width for displayed canvas
        const maxHeight = 500; // Max height for displayed canvas

        let drawWidth = img.width;
        let drawHeight = img.height;

        // Scale down if image is too large for display
        if (drawWidth > maxWidth || drawHeight > maxHeight) {
            const aspectRatio = img.width / img.height;
            if (drawWidth > maxWidth) {
                drawWidth = maxWidth;
                drawHeight = drawWidth / aspectRatio;
            }
            if (drawHeight > maxHeight) {
                drawHeight = maxHeight;
                drawWidth = drawHeight * aspectRatio;
            }
        }

        pixelCanvas.width = drawWidth;
        pixelCanvas.height = drawHeight;

        // Clear the canvas
        ctx.clearRect(0, 0, pixelCanvas.width, pixelCanvas.height);

        // Draw the image onto a temporary hidden canvas for pixel data access
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = img.width; // Use original image dimensions for data
        tempCanvas.height = img.height;
        tempCtx.drawImage(img, 0, 0);

        // Get image data from the temporary canvas
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data; // RGBA values

        // Loop through the image in blocks of pixelSize
        for (let y = 0; y < img.height; y += pixelSize) {
            for (let x = 0; x < img.width; x += pixelSize) {
                // Get the average color of the current block
                let r = 0, g = 0, b = 0, count = 0;

                // Iterate over the pixels within the current block
                for (let dy = 0; dy < pixelSize && (y + dy) < img.height; dy++) {
                    for (let dx = 0; dx < pixelSize && (x + dx) < img.width; dx++) {
                        const index = ((y + dy) * img.width + (x + dx)) * 4;
                        r += data[index];
                        g += data[index + 1];
                        b += data[index + 2];
                        count++;
                    }
                }

                if (count > 0) {
                    r = Math.floor(r / count);
                    g = Math.floor(g / count);
                    b = Math.floor(b / count);

                    // Draw a rectangle of the average color onto the *displayed* canvas
                    // Scale the drawing coordinates and size to match the displayed canvas size
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    ctx.fillRect(
                        x / img.width * drawWidth,
                        y / img.height * drawHeight,
                        pixelSize / img.width * drawWidth,
                        pixelSize / img.height * drawHeight
                    );
                }
            }
        }
    }
});