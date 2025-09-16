/**
 * Middleware de validación de entrada
 * Valida y sanitiza datos de entrada usando Joi
 */

const Joi = require("joi");
const { AppError } = require("./errorHandler");

/**
 * Middleware para validar datos de entrada
 * @param {Object} schema - Esquema de validación de Joi
 * @param {string} source - Fuente de los datos ('body', 'query', 'params')
 */
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const data = req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false, // Mostrar todos los errores
      stripUnknown: true, // Eliminar campos no definidos
      convert: true, // Convertir tipos automáticamente
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      throw new AppError(
        `Datos de entrada inválidos: ${errorMessages.join(", ")}`,
        400,
        "VALIDATION_ERROR"
      );
    }

    // Reemplazar los datos originales con los validados y sanitizados
    req[source] = value;
    next();
  };
};

/**
 * Esquemas de validación para diferentes endpoints
 */
const schemas = {
  // Autenticación
  login: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      "string.alphanum":
        "El nombre de usuario solo puede contener letras y números",
      "string.min": "El nombre de usuario debe tener al menos 3 caracteres",
      "string.max": "El nombre de usuario no puede tener más de 30 caracteres",
      "any.required": "El nombre de usuario es requerido",
    }),
    password: Joi.string().min(6).max(100).required().messages({
      "string.min": "La contraseña debe tener al menos 6 caracteres",
      "string.max": "La contraseña no puede tener más de 100 caracteres",
      "any.required": "La contraseña es requerida",
    }),
  }),

  // Crear usuario
  createUser: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      "string.alphanum":
        "El nombre de usuario solo puede contener letras y números",
      "string.min": "El nombre de usuario debe tener al menos 3 caracteres",
      "string.max": "El nombre de usuario no puede tener más de 30 caracteres",
      "any.required": "El nombre de usuario es requerido",
    }),
    password: Joi.string().min(6).max(100).required().messages({
      "string.min": "La contraseña debe tener al menos 6 caracteres",
      "string.max": "La contraseña no puede tener más de 100 caracteres",
      "any.required": "La contraseña es requerida",
    }),
    isAdmin: Joi.boolean().default(false).messages({
      "boolean.base": "isAdmin debe ser verdadero o falso",
    }),
  }),

  // Actualizar contraseña
  updatePassword: Joi.object({
    newPassword: Joi.string().min(6).max(100).required().messages({
      "string.min": "La nueva contraseña debe tener al menos 6 caracteres",
      "string.max": "La nueva contraseña no puede tener más de 100 caracteres",
      "any.required": "La nueva contraseña es requerida",
    }),
  }),

  // Asignar permisos de base de datos
  assignDatabasePermission: Joi.object({
    databaseName: Joi.string().min(1).max(100).required().messages({
      "string.min": "El nombre de la base de datos es requerido",
      "string.max":
        "El nombre de la base de datos no puede tener más de 100 caracteres",
      "any.required": "El nombre de la base de datos es requerido",
    }),
    permissions: Joi.array()
      .items(Joi.string().valid("read", "write", "create", "delete"))
      .min(1)
      .required()
      .messages({
        "array.min": "Debe especificar al menos un permiso",
        "any.required": "Los permisos son requeridos",
        "any.only": "Los permisos válidos son: read, write, create, delete",
      }),
  }),

  // Asignar permisos de tabla
  assignTablePermission: Joi.object({
    databaseName: Joi.string().min(1).max(100).required().messages({
      "string.min": "El nombre de la base de datos es requerido",
      "string.max":
        "El nombre de la base de datos no puede tener más de 100 caracteres",
      "any.required": "El nombre de la base de datos es requerido",
    }),
    tableName: Joi.string().min(1).max(100).required().messages({
      "string.min": "El nombre de la tabla es requerido",
      "string.max":
        "El nombre de la tabla no puede tener más de 100 caracteres",
      "any.required": "El nombre de la tabla es requerido",
    }),
    permissions: Joi.array()
      .items(Joi.string().valid("read", "write", "create", "delete"))
      .min(1)
      .required()
      .messages({
        "array.min": "Debe especificar al menos un permiso",
        "any.required": "Los permisos son requeridos",
        "any.only": "Los permisos válidos son: read, write, create, delete",
      }),
  }),

  // Parámetros de ID de usuario
  userId: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      "number.base": "El ID debe ser un número",
      "number.integer": "El ID debe ser un número entero",
      "number.positive": "El ID debe ser un número positivo",
      "any.required": "El ID del usuario es requerido",
    }),
  }),

  // Parámetros de userId (para rutas que usan :userId)
  userIdParam: Joi.object({
    userId: Joi.number().integer().positive().required().messages({
      "number.base": "El ID debe ser un número",
      "number.integer": "El ID debe ser un número entero",
      "number.positive": "El ID debe ser un número positivo",
      "any.required": "El ID del usuario es requerido",
    }),
  }),

  // Query parameters para paginación
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      "number.base": "La página debe ser un número",
      "number.integer": "La página debe ser un número entero",
      "number.min": "La página debe ser mayor a 0",
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      "number.base": "El límite debe ser un número",
      "number.integer": "El límite debe ser un número entero",
      "number.min": "El límite debe ser mayor a 0",
      "number.max": "El límite no puede ser mayor a 100",
    }),
  }),

  // Filtros de fecha
  dateFilter: Joi.object({
    startDate: Joi.date().iso().messages({
      "date.format":
        "La fecha de inicio debe estar en formato ISO (YYYY-MM-DD)",
    }),
    endDate: Joi.date().iso().min(Joi.ref("startDate")).messages({
      "date.format": "La fecha de fin debe estar en formato ISO (YYYY-MM-DD)",
      "date.min": "La fecha de fin debe ser posterior a la fecha de inicio",
    }),
  }),

  // Validación de fecha en formato DD/MM/AAAA
  dateDDMMYYYY: Joi.string()
    .pattern(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    .custom((value, helpers) => {
      const { parseDateDDMMYYYY } = require("../utils/dateUtils");
      const parsedDate = parseDateDDMMYYYY(value);
      if (!parsedDate) {
        return helpers.error("date.invalid");
      }
      return value;
    })
    .messages({
      "string.pattern.base": "La fecha debe estar en formato DD/MM/AAAA",
      "date.invalid": "La fecha proporcionada no es válida",
    }),

  // Validación de datetime en formato DD/MM/AAAA HH:MM
  datetimeDDMMYYYY: Joi.string()
    .pattern(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/)
    .custom((value, helpers) => {
      const { parseDateDDMMYYYY } = require("../utils/dateUtils");
      const parsedDate = parseDateDDMMYYYY(value);
      if (!parsedDate) {
        return helpers.error("date.invalid");
      }
      return value;
    })
    .messages({
      "string.pattern.base":
        "La fecha y hora debe estar en formato DD/MM/AAAA HH:MM",
      "date.invalid": "La fecha y hora proporcionada no es válida",
    }),

  // Validación para activar tabla
  activateTable: Joi.object({
    databaseName: Joi.string().min(1).max(100).required().messages({
      "string.min": "El nombre de la base de datos es requerido",
      "string.max":
        "El nombre de la base de datos no puede tener más de 100 caracteres",
      "any.required": "El nombre de la base de datos es requerido",
    }),
    tableName: Joi.string().min(1).max(100).required().messages({
      "string.min": "El nombre de la tabla es requerido",
      "string.max":
        "El nombre de la tabla no puede tener más de 100 caracteres",
      "any.required": "El nombre de la tabla es requerido",
    }),
    description: Joi.string().max(500).allow("").messages({
      "string.max": "La descripción no puede tener más de 500 caracteres",
    }),
    conditions: Joi.array()
      .items(
        Joi.object({
          columnName: Joi.string().required(),
          conditionType: Joi.string()
            .valid("min", "max", "range", "equals", "contains")
            .required(),
          value: Joi.alternatives()
            .try(
              Joi.string(),
              Joi.number(),
              Joi.object({
                min: Joi.alternatives().try(Joi.string(), Joi.number()),
                max: Joi.alternatives().try(Joi.string(), Joi.number()),
                value: Joi.alternatives().try(Joi.string(), Joi.number()),
              })
            )
            .required(),
        })
      )
      .default([])
      .messages({
        "array.base": "Las condiciones deben ser un array",
      }),
  }),

  // Validación para desactivar tabla
  deactivateTable: Joi.object({
    databaseName: Joi.string().min(1).max(100).required().messages({
      "string.min": "El nombre de la base de datos es requerido",
      "string.max":
        "El nombre de la base de datos no puede tener más de 100 caracteres",
      "any.required": "El nombre de la base de datos es requerido",
    }),
    tableName: Joi.string().min(1).max(100).required().messages({
      "string.min": "El nombre de la tabla es requerido",
      "string.max":
        "El nombre de la tabla no puede tener más de 100 caracteres",
      "any.required": "El nombre de la tabla es requerido",
    }),
  }),

  // Validación para datos de tabla
  tableData: Joi.object({
    data: Joi.object().required().messages({
      "object.base": "Los datos deben ser un objeto",
      "any.required": "Los datos son requeridos",
    }),
  }),

  // Validación para parámetros de base de datos y tabla
  databaseTableParams: Joi.object({
    databaseName: Joi.string().min(1).max(100).required().messages({
      "string.min": "El nombre de la base de datos es requerido",
      "string.max":
        "El nombre de la base de datos no puede tener más de 100 caracteres",
      "any.required": "El nombre de la base de datos es requerido",
    }),
    tableName: Joi.string().min(1).max(100).required().messages({
      "string.min": "El nombre de la tabla es requerido",
      "string.max":
        "El nombre de la tabla no puede tener más de 100 caracteres",
      "any.required": "El nombre de la tabla es requerido",
    }),
  }),
};

module.exports = {
  validate,
  schemas,
};
