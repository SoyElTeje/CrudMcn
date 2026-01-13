#!/bin/bash
# Script para limpiar Git respondiendo automáticamente "n" a las preguntas

# Responder "n" automáticamente a todas las preguntas
yes n | git gc --prune=now --aggressive

