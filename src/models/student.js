const studentSchema = {
  fullName: { required: true, min: 3, max: 100 },
  nationalId: { required: true, pattern: /^\d{10}$/, message: 'رقم الهوية يجب أن يكون 10 أرقام' },
  age: { required: true, min: 3, max: 100 },
  phone: { required: false, pattern: /^\d{10,14}$/ },
  parentPhone: { required: false },
  photo: { required: false }
};

function validateStudent(data) {
  const errors = [];
  if (!data.fullName || data.fullName.length < 3) {
    errors.push('الاسم يجب أن يكون 3 أحرف على الأقل');
  }
  if (!data.nationalId || !/^\d{10}$/.test(data.nationalId)) {
    errors.push('رقم الهوية يجب أن يكون 10 أرقام');
  }
  if (!data.age || data.age < 3 || data.age > 100) {
    errors.push('العمر يجب أن يكون بين 3 و 100');
  }
  if (data.phone && !/^\d{10,14}$/.test(data.phone)) {
    errors.push('رقم الجوال غير صحيح');
  }
  return errors;
}

module.exports = { studentSchema, validateStudent };
