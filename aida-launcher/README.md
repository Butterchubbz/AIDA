# AIDA (Accurate Inventory Data Assistant)

AIDA is a web-based inventory management system powered by PocketBase. This document provides instructions for setting up and running the application using the provided scripts.

## Quick Start

### For Windows Users

1.  **Run the setup script:** Double-click on `setup.bat`. This will check for necessary dependencies and install all required packages. Please follow any on-screen instructions.
2.  **Run the application:** Double-click on `start.bat`. This will launch the backend and frontend services.
3.  **Access AIDA:** Open your web browser and navigate to `http://localhost:5174`.

### For macOS and Linux Users

1.  **Run the setup script:**
    ```bash
    ./setup.sh
    ```
    This will check for necessary dependencies and install all required packages.

2.  **Run the application:**
    ```bash
    ./start.sh
    ```
    This will launch the backend and frontend services.

3.  **Access AIDA:** Open your web browser and navigate to `http://localhost:5174`.

## First-Time Setup

The first time you run AIDA, you will be guided through a setup wizard in your browser. This will involve:
1.  Creating an initial admin user account for PocketBase.
2.  Configuring your inventory locations.
3.  Selecting optional modules like RMA tracking and inbound shipments.

The application will create the necessary database collections based on your choices.

## Stopping the Application

-   **Windows:** Close the two terminal windows that were opened by `start.bat`.
-   **macOS/Linux:** Press `Ctrl+C` in the terminal where you ran `./start.sh`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.