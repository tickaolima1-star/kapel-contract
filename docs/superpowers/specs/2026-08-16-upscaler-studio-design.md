# Especificação de Design: KAPEL Upscaler Studio (Web App Standalone de Super-Resolução)

**Data:** 16/08/2026  
**Status:** APROVADO  
**Autor:** Patrick Eduardo Lima Silva & Antigravity (Superpowers HQ)  
**Projeto:** KAPEL Contract System & Tools (`kapel-contract`)

---

## 1. Visão Geral & Objetivos

O **KAPEL Upscaler Studio** é um Web App Standalone de Super-Resolução e Restauração de Imagens 100% Client-Side. Ele permite aumentar a resolução de imagens (em **2x** e **4x**) com preservação de nitidez, remoção de artefatos de compressão e ajuste fino de qualidade, sem enviar nenhuma imagem para servidores externos e sem custo de APIs.

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais (RF)
- **RF01 (Upload Multimodal):** Aceitar upload via Drag & Drop, seleção de arquivo, colar da área de transferência (`Ctrl+V`) ou amostras padrão (PNG, JPG, WEBP).
- **RF02 (Fatores de Escala 2x e 4x):** Permitir upscaling em 2x (HD) e 4x (Ultra HD 4K).
- **RF03 (Slider Comparativo Antes / Depois):** Exibir a imagem original e a imagem processada lado a lado com um divisor interativo arrastável (Split View).
- **RF04 (Painel de Ajustes Finos):**
  - Controle de Nitidez (*Unsharp Masking Sharpening*, 0% a 100%).
  - Controle de Suavização de Ruído (*Denoise*, 0% a 100%).
  - Ajuste de Contraste e Brilho Dinâmico.
- **RF05 (Exportação em Alta Definição):** Download da imagem processada nos formatos PNG, WEBP ou JPEG com ajuste de qualidade (80% a 100%).
- **RF06 (Navegação & Rota Dedicada):** Integrar o Upscaler na rota `/upscaler` com link no menu lateral (`Sidebar.tsx`).

### 2.2 Requisitos Não-Funcionais (RNF)
- **RNF01 (Zero Custo & 100% Local):** O processamento deve ser executado inteiramente no navegador do cliente via WebGL / HTML5 Canvas API.
- **RNF02 (Estabilidade de Memória via Tiling):** Imagens de grande formato (> 2048px) devem ser processadas em blocos (*tiles*) com sobreposição de borda para evitar estourar o limite de memória GPU do navegador.
- **RNF03 (Responsividade & UI Premium):** Interface em Dark Mode com glassmorphism alinhada ao design system KAPEL.

---

## 3. Arquitetura da Aplicação & Componentes UI

```
src/
├── app/
│   └── upscaler/
│       └── page.tsx                     # Tela Principal do Upscaler Studio
├── components/
│   └── upscaler/
│       ├── ImageUploader.tsx            # Zona de Upload (Drag & Drop, Pasting, Samples)
│       ├── BeforeAfterSlider.tsx        # Slider Comparativo Antes / Depois
│       └── UpscaleControls.tsx          # Painel de Parâmetros e Download
└── lib/
    └── upscaler/
        ├── engine.ts                    # Motor de Tiling & Canvas Processing Pipeline
        └── filters.ts                   # Convolução, Nitidez (Unsharp Masking) e Denoise
```

---

## 4. Algoritmos & Pipeline de Processamento de Imagem

### 4.1 Pipeline de Renderização
1. **Carregamento:** A imagem de entrada é desenhada em um `OffscreenCanvas` ou `Canvas2D`.
2. **Dimensionamento:** Calculam-se as novas dimensões baseadas no fator `2x` ou `4x`.
3. **Divisão em Blocos (Tiling Engine):**
   - Se a dimensão exceder `2048px`, o canvas divide o trabalho em matrizes de blocos de `512x512` com margem de segurança de `16px`.
4. **Interpolação de Alta Fidelidade:** Aplicam-se matrizes de convolução e reamostragem de alta qualidade.
5. **Pós-Processamento de Filtros:**
   - **Unsharp Masking Kernel:** `[0, -1, 0, -1, 5 + factor, -1, 0, -1, 0]`.
   - **Denoise Bilateral Filter:** Redução de artefatos mantendo bordas nítidas.
6. **Recomposição & Output:** Reconstituição dos blocos no canvas final de saída.

---

## 5. Plano de Testes & Validação

- **Testes Unitários Vitest (`tests/upscaler.test.ts`):**
  - Testar cálculo das dimensões de saída para fatores `2x` e `4x`.
  - Testar fatiamento de blocos do *Tiling Engine*.
  - Testar filtros de convolução de nitidez e denoise.
- **Verificação Visual:** Testar com imagens de baixa resolução, logos e fotos.
