import { describe, expect, test } from "bun:test";
import {
  changePasswordSchema,
  createUserSchema,
  fieldErrors,
  signInSchema,
} from "../src/lib/validation/auth";

describe("validação de formulários com Zod", () => {
  test("sign-in aceita dados válidos e normaliza o e-mail", () => {
    const result = signInSchema.safeParse({
      email: "admin@example.com",
      password: "senha123456",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("admin@example.com");
  });

  test("sign-in rejeita e-mail inválido e senha curta", () => {
    const result = signInSchema.safeParse({
      email: "nao-e-email",
      password: "123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toEqual({
        email: "Informe um e-mail válido",
        password: "A senha deve ter pelo menos 8 caracteres",
      });
    }
  });

  test("login rejeita 'wesley' como e-mail", () => {
    const result = signInSchema.safeParse({
      email: "wesley",
      password: "123456789",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error).email).toBe(
        "Informe um e-mail válido",
      );
    }
  });

  test("criação de usuário aceita dados válidos e remove espaços do nome", () => {
    const result = createUserSchema.safeParse({
      name: "  Maria Silva  ",
      email: "maria@example.com",
      password: "senha123456",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Maria Silva");
  });

  test("criação de usuário rejeita nome curto", () => {
    const result = createUserSchema.safeParse({
      name: "M",
      email: "maria@example.com",
      password: "senha123456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error).name).toBe(
        "O nome deve ter pelo menos 2 caracteres",
      );
    }
  });

  test("alteração de senha aceita senhas iguais e válidas", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "nova-senha-123",
      confirmPassword: "nova-senha-123",
    });
    expect(result.success).toBe(true);
  });

  test("alteração de senha rejeita senhas diferentes", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "nova-senha-123",
      confirmPassword: "outra-senha-123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error).confirmPassword).toBe(
        "As senhas não coincidem",
      );
    }
  });

  test("alteração de senha rejeita senha curta", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "123",
      confirmPassword: "123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error).newPassword).toBe(
        "A senha deve ter pelo menos 8 caracteres",
      );
    }
  });
});
