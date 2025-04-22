import bcrypt from 'bcryptjs';

const saltRounds = 10;

export const hashPassword = async (req, res, next) => {
  const callback = (err, hash) => {
    if (err) {
      console.error('Error bcrypt:', err);
      res.status(500).json(err);
    } else {
      res.locals.hash = hash;
      // console.log(hash);
      next();
    }
  };

  bcrypt.hash(req.body.password, saltRounds, callback);
};

export const comparePassword = async (req, res, next) => {
  const callback = (err, result) => {
    if (err) {
      console.error('Error bcrypt:', err);
      res.status(500).json(err);
    } else {
      res.locals.result = result;
      // console.log(result);
      next();
    }
  };

  bcrypt.compare(req.body.password, res.locals.hash, callback);
};
