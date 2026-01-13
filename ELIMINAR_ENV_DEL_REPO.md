# 🗑️ Guía para Eliminar archivos .env del Repositorio Git

## ⚠️ IMPORTANTE: Seguridad

Los archivos `backend/env.production` y `frontend/env.production` contienen información sensible (contraseñas, secrets) y **NO deberían estar en el repositorio**.

Esta guía te ayudará a eliminarlos completamente del historial de Git.

---

## 📋 Paso 1: Verificar qué archivos están en el repo

```bash
git ls-files | grep env.production
```

Deberías ver:

- `backend/env.production`
- `frontend/env.production`

---

## 📋 Paso 2: Eliminar del repositorio local (mantener archivos locales)

```bash
# Eliminar del índice de Git (pero mantener los archivos en disco)
git rm --cached backend/env.production
git rm --cached frontend/env.production

# Verificar que están eliminados del índice
git status
```

---

## 📋 Paso 3: Eliminar del historial de Git

**⚠️ ADVERTENCIA**: Esto reescribirá el historial de Git. Si ya hiciste push, necesitarás hacer force push.

### Opción A: Usando git filter-branch (método tradicional)

```bash
# Eliminar del historial completo
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/env.production frontend/env.production" \
  --prune-empty --tag-name-filter cat -- --all
```

### Opción B: Usando git-filter-repo (método recomendado, más rápido)

Primero instala git-filter-repo:

```bash
# Windows (con pip)
pip install git-filter-repo

# O descarga desde: https://github.com/newren/git-filter-repo
```

Luego elimina los archivos:

```bash
git filter-repo --path backend/env.production --path frontend/env.production --invert-paths
```

### Opción C: Usando BFG Repo-Cleaner (más fácil, requiere Java)

1. Descarga BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Ejecuta:

```bash
java -jar bfg.jar --delete-files env.production
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

---

## 📋 Paso 4: Verificar que .gitignore está actualizado

Ya actualicé el `.gitignore` para incluir `env.production` (sin punto). Verifica que esté correcto:

```bash
cat .gitignore | grep env.production
```

Deberías ver:

- `backend/env.production`
- `frontend/env.production`

---

## 📋 Paso 5: Commit de los cambios

```bash
# Agregar el .gitignore actualizado
git add .gitignore

# Commit
git commit -m "chore: eliminar archivos env.production del repo y actualizar .gitignore"
```

---

## 📋 Paso 6: Eliminar del repositorio remoto

**⚠️ ADVERTENCIA**: Esto reescribirá el historial en el remoto. Asegúrate de:

1. Coordinar con tu equipo (si trabajas en equipo)
2. Hacer backup del repositorio
3. Todos deben hacer un fresh clone después

### Si usaste git filter-branch o git-filter-repo:

```bash
# Force push (reescribe el historial remoto)
git push origin --force --all
git push origin --force --tags
```

### Si usaste BFG:

```bash
git push origin --force --all
```

---

## 📋 Paso 7: Limpiar referencias locales

```bash
# Limpiar referencias obsoletas
git reflog expire --expire=now --all

# Limpiar con respuesta automática "n" a las preguntas
# (Windows Git Bash o WSL)
yes n | head -20 | git gc --prune=now --aggressive

# O alternativamente (si yes no está disponible):
printf 'n\nn\nn\nn\nn\nn\nn\nn\nn\nn\nn\nn\nn\nn\nn\nn\nn\nn\nn\nn\n' | git gc --prune=now --aggressive
```

---

## 📋 Paso 8: Verificar que los archivos ya no están

```bash
# Verificar que no están en el repo
git ls-files | grep env.production

# No debería mostrar nada
```

---

## 🔒 Paso 9: Rotar credenciales comprometidas

**⚠️ CRÍTICO**: Como los archivos estuvieron en el repositorio, debes:

1. **Cambiar todas las contraseñas** que estaban en esos archivos:

   - `DB_PASSWORD`
   - `JWT_SECRET` (generar uno nuevo)
   - `SA_PASSWORD` (si estaba en docker-compose.yml)
   - Cualquier otra credencial

2. **Generar nuevo JWT_SECRET**:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Actualizar contraseñas en la base de datos**

4. **Notificar a tu equipo** si trabajas en grupo

---

## 📝 Comandos Rápidos (Resumen)

```bash
# 1. Eliminar del índice
git rm --cached backend/env.production frontend/env.production

# 2. Eliminar del historial (elige UN método)
# Método A: git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/env.production frontend/env.production" \
  --prune-empty --tag-name-filter cat -- --all

# Método B: git-filter-repo (recomendado)
git filter-repo --path backend/env.production --path frontend/env.production --invert-paths

# 3. Actualizar .gitignore (ya está hecho)
git add .gitignore

# 4. Commit
git commit -m "chore: eliminar archivos env.production del repo"

# 5. Force push (⚠️ ADVERTENCIA: reescribe historial)
git push origin --force --all
git push origin --force --tags

# 6. Limpiar (con respuesta automática "n")
git reflog expire --expire=now --all
yes n | head -20 | git gc --prune=now --aggressive
```

---

## ⚠️ Advertencias Importantes

1. **Backup**: Haz backup del repositorio antes de hacer force push
2. **Equipo**: Si trabajas en equipo, coordina con ellos. Todos necesitarán hacer fresh clone
3. **Credenciales**: **ROTA TODAS LAS CREDENCIALES** que estuvieron en esos archivos
4. **Historial**: El historial de Git será reescrito. Los commits antiguos cambiarán sus hashes
5. **Forks**: Si hay forks del repositorio, también necesitarán actualizarse

---

## 🔍 Verificar que funcionó

Después de todo el proceso:

```bash
# Verificar que no están en el repo
git ls-files | grep env.production
# No debería mostrar nada

# Verificar que los archivos locales siguen existiendo
ls backend/env.production frontend/env.production
# Deberían existir (solo eliminados del Git, no del disco)

# Verificar que .gitignore los ignora
git status
# No deberían aparecer como archivos sin seguimiento
```

---

## 📚 Referencias

- [Git Filter Branch](https://git-scm.com/docs/git-filter-branch)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
