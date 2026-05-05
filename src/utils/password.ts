/**
 * UTILITÁRIO DE SEGURANÇA DE PALAVRAS-PASSE
 * Centraliza a lógica de hashing para garantir consistência em todo o sistema.
 */

export const PasswordUtils = {
  /**
   * Configurações recomendadas para o Argon2id (OWASP)
   */
  params: {
    algorithm: "argon2id" as const, // Força o uso do algoritmo mais seguro disponível no Bun
    memoryCost: 65536, // 64MB de memória
    timeCost: 2, // 2 iterações
  },

  /**
   * Gera um hash seguro de uma password em texto simples.
   */
  async hash(password: string): Promise<string> {
    // O Bun utiliza Argon2id por padrão com estas configurações
    return await Bun.password.hash(password, this.params);
  },

  /**
   * Compara uma password fornecida com um hash guardado na base de dados.
   */
  async compare(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;

    try {
      return await Bun.password.verify(password, hash);
    } catch (error) {
      console.error("Erro ao verificar password:", error);
      return false;
    }
  },

  /**
   * Verifica se o hash atual ainda cumpre os requisitos de segurança.
   * Útil para atualizar hashes antigos sem que o utilizador perceba.
   */
  needsRehash(hash: string): boolean {
    try {
      // O cast 'as any' previne erros se o @types/bun estiver desatualizado
      return (Bun.password as any).needsRehash(hash, this.params);
    } catch (e) {
      return false;
    }
  },
};
