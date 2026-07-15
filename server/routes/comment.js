import express from "express";

import {
  deletecomment,
  getallcomment,
  postcomment,
  editcomment,
  reactcomment,
  translateComment,
  getcityname,
} from "../controllers/comment.js";

const routes = express.Router();

routes.post("/postcomment", postcomment);
routes.post("/translate", translateComment);
routes.get("/city", getcityname);
routes.patch("/:id/react", reactcomment);
routes.delete("/deletecomment/:id", deletecomment);
routes.post("/editcomment/:id", editcomment);
routes.get("/:videoid", getallcomment);

export default routes;