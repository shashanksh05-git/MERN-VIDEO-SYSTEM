import comment from "../Modals/comment.js";
import mongoose from "mongoose";

const blockedSpecialCharsRegex = /[@#$%^&*<>{}\[\]\\/|~`_=+]/;

const hasBlockedSpecialChars = (text) => {
  return blockedSpecialCharsRegex.test(text);
};

export const postcomment = async (req, res) => {
  const { videoid, userid, commentbody, usercommented, city } = req.body;

  if (!videoid || !userid || !commentbody || !usercommented) {
    return res.status(400).json({
      message: "Required fields are missing",
    });
  }

  if (hasBlockedSpecialChars(commentbody)) {
    return res.status(400).json({
      message:
        "Comment blocked. Special characters like @ # $ % ^ & * are not allowed.",
    });
  }

  const commentdata = {
    videoid,
    userid,
    commentbody,
    usercommented,
    city: city || "Unknown City",
  };

  const postcomment = new comment(commentdata);

  try {
    const savedComment = await postcomment.save();

    return res.status(200).json({
      comment: true,
      result: savedComment,
    });
  } catch (error) {
    console.error("Post comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallcomment = async (req, res) => {
  const { videoid } = req.params;

  try {
    const commentvideo = await comment
      .find({ videoid: videoid })
      .sort({ createdAt: -1 });

    return res.status(200).json(commentvideo);
  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("Comment unavailable");
  }

  try {
    await comment.findByIdAndDelete(_id);
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("Comment unavailable");
  }

  if (!commentbody || !commentbody.trim()) {
    return res.status(400).json({ message: "Comment cannot be empty" });
  }

  if (hasBlockedSpecialChars(commentbody)) {
    return res.status(400).json({
      message:
        "Comment blocked. Special characters like @ # $ % ^ & * are not allowed.",
    });
  }

  try {
    const updatecomment = await comment.findByIdAndUpdate(
      _id,
      {
        $set: { commentbody: commentbody },
      },
      { new: true }
    );

    return res.status(200).json(updatecomment);
  } catch (error) {
    console.error("Edit comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const reactcomment = async (req, res) => {
  const { id: commentId } = req.params;
  const { userid, action } = req.body;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(404).json({ message: "Comment unavailable" });
  }

  if (!userid || !action) {
    return res.status(400).json({ message: "User ID and action are required" });
  }

  if (!["like", "dislike"].includes(action)) {
    return res.status(400).json({ message: "Invalid reaction" });
  }

  try {
    const existingComment = await comment.findById(commentId);

    if (!existingComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (existingComment.userid.toString() === userid.toString()) {
      return res.status(400).json({
        message: "You cannot like or dislike your own comment",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userid);

    existingComment.likes = existingComment.likes.filter(
      (id) => id.toString() !== userid.toString()
    );

    existingComment.dislikes = existingComment.dislikes.filter(
      (id) => id.toString() !== userid.toString()
    );

    if (action === "like") {
      existingComment.likes.push(userObjectId);
    }

    if (action === "dislike") {
      existingComment.dislikes.push(userObjectId);
    }

    if (existingComment.dislikes.length >= 2) {
      await comment.findByIdAndDelete(commentId);

      return res.status(200).json({
        deleted: true,
        message: "Comment removed after receiving 2 dislikes",
      });
    }

    const updatedComment = await existingComment.save();

    return res.status(200).json({
      deleted: false,
      result: updatedComment,
    });
  } catch (error) {
    console.error("React comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const translateComment = async (req, res) => {
  try {
    const { text, targetLanguage = "en" } = req.body;

    if (!text) {
      return res.status(400).json({
        message: "Text is required",
      });
    }

    const cleanText = text.trim();
    const lowerText = cleanText.toLowerCase();

    // Auto detect fails for small words like bonjour/hola/merci
    const shortWordLanguageMap = {
      bonjour: "fr",
      merci: "fr",
      salut: "fr",
      hola: "es",
      gracias: "es",
      namaste: "hi",
      shukriya: "hi",
      ciao: "it",
      danke: "de",
    };

    const sourceLanguage = shortWordLanguageMap[lowerText] || "auto";
    const lang = targetLanguage || "en";

    console.log("TRANSLATE INPUT:", {
      cleanText,
      sourceLanguage,
      targetLanguage: lang,
    });

    const url =
      "https://translate.googleapis.com/translate_a/single" +
      `?client=gtx&sl=${sourceLanguage}&tl=${lang}&dt=t&q=${encodeURIComponent(cleanText)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google translate failed: ${response.status}`);
    }

    const data = await response.json();

    console.log("GOOGLE TRANSLATE RAW:", JSON.stringify(data));

    const translatedText = data?.[0]?.map((item) => item?.[0]).join("").trim();

    if (!translatedText) {
      return res.status(500).json({
        message: "Translation failed",
      });
    }

    return res.status(200).json({
      originalText: cleanText,
      sourceLanguage,
      targetLanguage: lang,
      translatedText,
    });
  } catch (error) {
    console.log("Translation error:", error);

    return res.status(500).json({
      message: "Translation failed",
      error: error.message,
    });
  }
};

export const getcityname = async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      city: "Unknown City",
    });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Streamify-Video-Platform",
      },
    });

    const data = await response.json();

    const city =
      data?.address?.city ||
      data?.address?.town ||
      data?.address?.village ||
      data?.address?.county ||
      "Unknown City";

    return res.status(200).json({ city });
  } catch (error) {
    console.error("City fetch error:", error);
    return res.status(200).json({
      city: "Unknown City",
    });
  }
};