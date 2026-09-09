/**
 * Sends a consistent success envelope: { success, message, data }.
 * Keeping this in one place means every controller returns JSON in
 * exactly the same shape, which is what the submission instructions'
 * sample responses show.
 */
const sendSuccess = (res, statusCode, message, data = null) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess };
