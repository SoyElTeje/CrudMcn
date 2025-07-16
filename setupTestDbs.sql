-- Tabla Maquinas

CREATE TABLE Maquinas (
    IdMaquina INT IDENTITY(1,1) PRIMARY KEY,
    TipoMaquina VARCHAR(10) NOT NULL CHECK (TipoMaquina IN ('pequena', 'mediana', 'grande')),
    PesoMaquina DECIMAL(10,2) NOT NULL CHECK (PesoMaquina > 0),
    Descripcion NVARCHAR(255) NULL
);

INSERT INTO Maquinas (TipoMaquina, PesoMaquina, Descripcion)
VALUES ('pequena', 150.50, 'Maquina compacta para tareas livianas');

INSERT INTO Maquinas (TipoMaquina, PesoMaquina, Descripcion)
VALUES ('mediana', 320.75, 'Maquina de uso general con capacidad media');

INSERT INTO Maquinas (TipoMaquina, PesoMaquina, Descripcion)
VALUES ('grande', 850.00, 'Maquina industrial de alta capacidad');

INSERT INTO Maquinas (TipoMaquina, PesoMaquina, Descripcion)
VALUES ('pequena', 180.20, 'Maquina portatil para mantenimientos');

INSERT INTO Maquinas (TipoMaquina, PesoMaquina, Descripcion)
VALUES ('mediana', 400.00, 'Maquina para procesos semi-industriales');

-- Tabla Funcionario
CREATE TABLE Funcionario (
    IdFuncionario INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    Apellido NVARCHAR(100) NOT NULL,
    Cedula VARCHAR(12) NOT NULL UNIQUE,
    FechaIngreso DATE NOT NULL
);

INSERT INTO Funcionario (Nombre, Apellido, Cedula, FechaIngreso)
VALUES ('Ana', 'Pérez', '41234567', '2022-03-15');

INSERT INTO Funcionario (Nombre, Apellido, Cedula, FechaIngreso)
VALUES ('Juan', 'González', '52345678', '2023-01-10');

INSERT INTO Funcionario (Nombre, Apellido, Cedula, FechaIngreso)
VALUES ('Lucía', 'Rodríguez', '33456789', '2021-07-05');

INSERT INTO Funcionario (Nombre, Apellido, Cedula, FechaIngreso)
VALUES ('Carlos', 'Fernández', '44567890', '2020-11-20');

INSERT INTO Funcionario (Nombre, Apellido, Cedula, FechaIngreso)
VALUES ('Sofía', 'Martínez', '55678901', '2024-02-28');


-- UsaMaquina

CREATE TABLE UsaMaquina (
    IdUsaMaquina INT IDENTITY(1,1) PRIMARY KEY,
    IdFuncionario INT NOT NULL,
    IdMaquina INT NOT NULL,
    FechaComienzo DATETIME NOT NULL,
    FechaFin DATETIME NULL,

    CONSTRAINT FK_UsaMaquina_Funcionario FOREIGN KEY (IdFuncionario)
        REFERENCES Funcionario(IdFuncionario)
        ON DELETE CASCADE,

    CONSTRAINT FK_UsaMaquina_Maquina FOREIGN KEY (IdMaquina)
        REFERENCES Maquinas(IdMaquina)
        ON DELETE CASCADE
);

INSERT INTO UsaMaquina (IdFuncionario, IdMaquina, FechaComienzo, FechaFin)
VALUES (1, 2, '2024-06-01 08:00', '2024-06-01 16:00');

INSERT INTO UsaMaquina (IdFuncionario, IdMaquina, FechaComienzo, FechaFin)
VALUES (2, 3, '2024-06-02 09:00', '2024-06-02 17:30');

INSERT INTO UsaMaquina (IdFuncionario, IdMaquina, FechaComienzo, FechaFin)
VALUES (3, 1, '2024-06-03 07:30', '2024-06-03 15:45');

INSERT INTO UsaMaquina (IdFuncionario, IdMaquina, FechaComienzo, FechaFin)
VALUES (4, 5, '2024-06-04 08:15', NULL); -- máquina aún en uso

INSERT INTO UsaMaquina (IdFuncionario, IdMaquina, FechaComienzo, FechaFin)
VALUES (5, 4, '2024-06-05 08:00', '2024-06-05 14:30');