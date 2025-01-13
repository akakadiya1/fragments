# fragments

A repository for cloud computing course labs and projects, showcasing concepts like cloud deployment, microservices, and distributed systems using tools like Docker, Kubernetes, and AWS.

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

- Node.js (latest version recommended)
- npm (comes with Node.js)
- curl
- jq for processing JSON data in the terminal

### Installation

1. Clone the repository:
   ```bash
   git clone <repository_url>
   ```
2. Navigate to the project directory:
   ```bash
   cd <project_directory>
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Install additional tools:
   ```bash
   npm install --save-dev prettier
   npm install --save-dev pino-pretty
   npm install express cors helmet compression stoppable
   ```

## Scripts

### **1. Lint the Code**

Run ESLint to check your code for style issues and potential errors:

```bash
npm run lint
```

- **Purpose**: Ensures code consistency and catches common errors.
- **How it Works**: Runs ESLint on all JavaScript files in the `src` directory.

### **2. Start the Server**

This script starts the server in a production environment.

```bash
npm run start
```

- **Purpose**: Runs the server with `node`.
- **When to Use**: For running the application in production.

### **3. Run the Development Server**

This script starts the server in development mode, with debug-level logging enabled and file watching.

```bash
npm run dev
```

- **Purpose**: Starts the server with `nodemon`, which watches for changes in the `src` directory and restarts the server automatically.
- **Environment Variable**: `LOG_LEVEL=debug` is set using `cross-env` to enable detailed debug logs.
- **When to Use**: While actively developing the application.

### **4. Debug the Server**

This script starts the server in debug mode, allowing us to attach a debugger.

```bash
npm run debug
```

- **Purpose**: Launches the server with `nodemon` and enables remote debugging via the inspect protocol.
- **Environment Variable**: `LOG_LEVEL=debug` is set using `cross-env`.
- **Debugger Address**: Debugging is available at `0.0.0.0:9229`.

## NOTES

To verify that the server is running and returning the correct headers and JSON data:

- 1. Start the server in any mode (e.g., npm run start).
- 2. Use curl with jq to inspect the response:
  - ```bash
    curl -s localhost:8080 | jq
    ```
  - This will format and display the JSON response from the server.
  - Example output:
    ```bash
    {
      "status": "ok",
      "author": "Your Name",
      "githubUrl": "https://github.com/<username>/<repository>",
      "version": "0.0.1"
    }
    ```
- 3. To check the HTTP headers returned by the server, use:
    - ```bash
      curl -i localhost:8080
      ```
    - Example output:
    ```bash
    HTTP/1.1 200 OK
    Content-Type: application/json; charset=utf-8
    Cache-Control: no-cache
    Access-Control-Allow-Origin: *
    ...
    ```

## Troubleshooting

- If you encounter the error `'LOG_LEVEL' is not recognized`, ensure you have installed `cross-env` by running:
  ```bash
  npm install cross-env --save-dev
  ```
- Check that `nodemon` is installed as a dependency. If not, install it:
  ```bash
  npm install nodemon --save-dev
  ```
- Verify that you have the correct environment variables set for your development or production needs.
