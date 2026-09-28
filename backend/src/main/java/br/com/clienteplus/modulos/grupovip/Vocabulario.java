package br.com.clienteplus.modulos.grupovip;

// Como a Biblioteca chama o que guarda (Config.bibliotecaTipo): "livro" ou
// "material". Os textos fixos do robô são escritos com "livro" e passam por
// t(); títulos e nomes de arquivo NUNCA passam (um material pode se chamar
// "Livro de receitas").
record Vocabulario(boolean materiais) {

    static Vocabulario de(Config c) {
        return new Vocabulario(c.materiais());
    }

    String t(String texto) {
        if (!materiais) return texto;
        return texto.replace("livro(s)", "material(is)")
                .replace("Livros", "Materiais")
                .replace("livros", "materiais")
                .replace("Livro", "Material")
                .replace("livro", "material");
    }

    // ícone de cada item nas listas do robô
    String icone() {
        return materiais ? "📄" : "📘";
    }
}
