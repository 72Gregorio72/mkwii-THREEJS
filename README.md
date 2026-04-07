*This project has been created as part of the 42 curriculum by ftersill, vcastald, gpicchio.*

# Mario Kart React - ft_transcendence

## Description
**Mario Kart React** is a full-stack, real-time 3D multiplayer racing web application inspired by the classic Mario Kart series. The goal of this project is to create an engaging multiplayer gaming experience while meeting the strict architectural and technical requirements of the 42 ft_transcendence project. 

Key features include an immersive 3D environment, real-time multiplayer racing, a custom AI opponent, standard user authentication, tournament management, and game customization through power-ups. 

## Instructions
**Prerequisites:**
* Docker and Docker Compose
* A Unix-based OS (Linux/macOS) or WSL for Windows

**Running the project:**
1. Clone the repository and navigate to its root directory.
2. Run the provided startup script:
   ```bash
   ./start.sh

What this script does:

Generates the necessary SSL certificates (cert.pem and key.pem) for HTTPS communication.

Cleans up existing Docker containers and volumes.

Builds the images and starts all the required containers.

Once the script finishes, the application will be accessible via your browser (e.g., at https://localhost:8443 or the configured port).

## Resources
**Communication & Management**
Discord, Slack, and Google Docs.

**Documentation**
React, NestJS, Prisma, and Three.js official documentation.

**AI Usage**
Artificial Intelligence tools were utilized to assist in troubleshooting complex 3D math problems (e.g., quaternions for the karts), generating boilerplate code, and helping format this documentation. All generated code was thoroughly reviewed and tested by the team.

## Team Information
**gpicchio:** Product Owner (PO) and Developer. Responsibilities include defining the product vision, maintaining the project notes and backlog, and ensuring the final application meets the required modules and user needs.

**vcastald:** Project Manager (PM) and Developer. Responsibilities include organizing tasks, facilitating team coordination, tracking progress across Discord/Slack, and developing core features.

**ftersill:** Technical Lead (TL) and Developer. Responsibilities include overseeing the architecture, making crucial technical stack decisions (e.g., handling the Nginx reverse proxy architecture), and ensuring code quality across the team.

## Project Management
Work Organization: The team divided tasks based on the required modules, maintaining shared notes and documentation on Google Docs to track the implementation of the 19 targeted points.

**Tools Used**
Google Docs for shared notes, database schema planning, and tracking module points.

Discord and Slack for daily real-time communication and team meetings.

## Technical Stack
**Frontend:** React (Bootstrapped with Vite).

    Frontend State Management: Zustand (Chosen to handle global states easily without the heavy boilerplate of Redux).

**Backend:** NestJS.

    Database & ORM: PostgreSQL managed via Prisma ORM.

    Real-time Communication: WebSockets.

    Graphics: 3D Graphics implemented with Three.js.

    Server/Proxy: Nginx.

**Technical Challenges - The Firefox WebSocket Issue**
During development, we faced a critical issue with Firefox. Due to its strict security and privacy policies compared to Chromium-based browsers (like Brave), Firefox blocked WebSocket connections over self-signed HTTPS certificates. This completely broke the multiplayer game mode.

Solution: We resolved this by changing the transport method settings in the NestJS backend and Vite frontend, and implementing an Nginx proxy server to properly handle the secure websocket communication and proxy the requests.

## Database Schema
Below is the visual representation of our database schema, focused on standard user management and game statistics:

Snippet di codice
erDiagram
    USER {
        string Nickname
        string Email
        string Password
        string Avatar
        int Wins_Online
        int Wins_Offline
        list Friends
    }

## Features List
**User System:** Secure login, registration, email/password handling, and friend management. (Worked on by: vcastald)

**3D Racing Engine:** Track rendering, kart physics, and collision handling. (Worked on by: gpicchio, ftersill)

**Multiplayer Syncing:** Real-time kart position syncing via WebSockets. (Worked on by: vcastald, gpicchio, ftersill)

**AI Bots:** Computer-controlled opponents. (Worked on by: gpicchio)

**Tournaments:** Bracket systems to manage multiple races. (Worked on by: vcastald, ftersill)

**Power-ups:** In-game items to gain advantages over opponents. (Worked on by: gpicchio)

## Modules
We aimed for a total of 19 points by implementing the following modules:

Use a Framework (Major - 2 points): NestJS for the backend and React for the frontend.

Real-time Features (Major - 2 points): Implemented via WebSockets for live gameplay.

Standard User Management (Major - 2 points): Registration, authentication, profiles, and friends system. (Note: 2FA was explicitly excluded from the scope).

Web-based Game (Major - 2 points): The core Mario Kart racing game.

Multiplayer / Remote Players (Major - 2 points): Allowing users to play against each other over the network.

Advanced 3D Graphics (Major - 2 points): Built completely using Three.js.

Artificial Intelligence (Major - 2 points): AI opponents capable of navigating the track and racing against players.

Tournament System (Minor - 1 point): Organized matchmaking and bracket tracking.

Game Customization (Minor - 1 point): Power-ups and items within the races.

Use an ORM (Minor - 1 point): Prisma ORM was added to handle the database layer securely and cleanly.

(Note: [Add Name(s)] worked on the Frontend/Game modules. [Add Name(s)] worked on the Backend/User Management modules).

## Individual Contributions
gpicchio (PO/Developer): * Features/Modules: [Describe what you coded, e.g., Set up Prisma ORM, built the Tournament logic, etc.]

Challenges overcome: [Describe a bug you fixed or a technical challenge you solved]

vcastald (PM/Developer): * Features/Modules: [Describe what you coded, e.g., Created the Start script, developed the Zustand stores, built the User Management UI, etc.]

Challenges overcome: [Describe a bug you fixed or a technical challenge you solved]

ftersill (TL/Developer): * Features/Modules: [Describe what you coded, e.g., Architected the Nginx proxy fix for Firefox, implemented the Three.js 3D graphics, built the WebSockets syncing, etc.]

Challenges overcome: Successfully debugged and resolved the self-signed certificate WebSocket issue on Firefox by configuring Nginx.