import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from "morgan";
import authRoutes from "./routes/AuthRoute/Auth.js";
import requestRoutes from "./routes/requests/requests.js";
import skillRoutes from "./routes/Skills/skills.js";
import profileRoutes from "./routes/userinfo/profile.js";
import chatRoutes from "./routes/Messages/Messages.js";
import adminSkillRoutes from "./routes/Admin/AdminSkills.js";

const app = express();
dotenv.config();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));


const PORT = process.env.PORT || 3001;

app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes); 
app.use("/api/skills", skillRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/chat", chatRoutes);
app.use('/api/admin/skills', adminSkillRoutes);


// app.use(()=>{
//     res.json({message: "route not found"});
// });


app.listen(PORT,()=>{
    console.log(`Listening on ${PORT}`);
});