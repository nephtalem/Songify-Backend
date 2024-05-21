import jwt from "jsonwebtoken";
import { createError } from "../utils/error.js";


export const verifyToken = async (req, res, next) => {
  let token;

  if (
    req?.headers?.authorization &&
    req?.headers?.authorization.startsWith("Bearer")
  ) {
    token = req?.headers?.authorization.split(" ")[1];

  }
  if (!token) {
    return next(createError(401, "You are not authenticated!"));
  }
  

  jwt.verify(token, process.env.JWT, (err, user) => {
    if (err) return next(createError(403, "Token is not valid!"));
    req.user = user;
    next();
  });
};

export const verifyUser = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req?.user?.userId) {
      next();
    } else {
      return next(createError(403, "You are not Authorized User!"));
    }
  });
};

export const verifyPublisher = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req?.user?.role === "Publisher") {
      next();
    } else {
      return next(createError(403, "You are not Publisher!"));
    }
  });
};

export const verifyReviewer = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req?.user?.role === "Reviewer") {
      next();
    } else {
      return next(createError(403, "You are not authorized Reviewer!"));
    }
  });
};

export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req?.user?.role === "Admin") {
      next();
    } else {
      return next(createError(403, "You are not authorized!"));
    }
  });
};
export const  verifyAdminOrReviewer = async (req, res, next) => {
  await verifyToken(
    req, res, () => {
    if (req?.user?.role === "Admin" || req?.user?.role === "Reviewer") {
      next();
    } else {
      return next(createError(403,"You are not authorized admin or reviewer!"));
    }
  }
  );
};
export const verifyAdminOrPublisher = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req?.user?.role === "Admin" || req?.user?.role === "Publisher") {
      next();
    } else {
      return next(createError(403, "You are not authorized admin or Publisher!"));
    }
  });
};
export const verifyAdminOrPublisherOrReviewer = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req?.user?.role === "Admin" || req?.user?.role === "Publisher" || req?.user?.role === "Reviewer") {
      next();
    } else {
      return next(createError(403, "You are not authorized admin or Publisher!"));
    }
  });
};
