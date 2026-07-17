function success(res, data = {}, status = 200) {
  return res.status(status).json({ success: true, ...data });
}

function error(res, message, status = 400) {
  return res.status(status).json({ success: false, error: message });
}

function paginated(res, items, total, page, limit) {
  return res.status(200).json({
    success: true,
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  });
}

module.exports = { success, error, paginated };
