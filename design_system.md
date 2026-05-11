# 🎨 Design System: Clinical Curator

Este documento detalha as especificações visuais e técnicas do design system **"Clinical Curator"**, desenvolvido para criar interfaces de alta performance, sobriedade e precisão em ambientes hospitalares.

---

## 🏛️ Conceito Visual
O **Clinical Curator** foca no bem-estar visual do profissional de saúde. Ele utiliza um modo escuro profundo com toques de cores vibrantes, porém suaves (Teal e Indigo), para destacar o que é essencial sem causar fadiga ocular durante longos períodos de análise de dados.

## 🔠 Tipografia
- **Fonte Principal:** [Inter](https://fonts.google.com/specimen/Inter) (Variáveis: 300 a 700)
- **Fonte Mono:** [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (Para dados técnicos/planilhas)
- **Base:** `font-sans antialiased`

---

## 🎨 Paleta de Cores (Tokens HSL)

Abaixo estão os valores HSL (Hue, Saturation, Lightness) utilizados como base na aplicação.

### 🌑 Cores de Fundo (Base Técnica)
| Elemento | Valor HSL | Descrição |
| :--- | :--- | :--- |
| **Background** | `220 20% 8%` | Preto azulado profundo para o fundo principal |
| **Card** | `220 18% 11%` | Cinza escuro para elevação de cards |
| **Secondary** | `220 16% 16%` | Elementos de interface neutros |
| **Border/Input** | `220 14% 18%` | Bordas sutis para separação de seções |

### 💎 Cores de Destaque (Identidade)
| Elemento | Valor HSL | Nome Sugerido |
| :--- | :--- | :--- |
| **Primary** | `199 89% 48%` | Clinical Blue (Destaque principal) |
| **Accent** | `172 66% 50%` | Clinical Teal (Conformidade e Sucesso) |

### 🚥 Cores Semânticas (Status)
| Status | Valor HSL | Uso |
| :--- | :--- | :--- |
| **Success** | `142 71% 45%` | Conformidade 100%, Concluído |
| **Warning** | `47 96% 53%` | Atenção, Prazo Próximo |
| **Danger** | `0 72% 55%` | Não Conformidade, Erro Crítico |
| **Purple** | `280 65% 50%` | Tendências, Dados Estatísticos |

---

## ✨ Efeitos e Glassmorphism

O design utiliza camadas translúcidas e gradientes para criar profundidade.

### 🌊 Gradientes
- **Header:** `linear-gradient(180deg, hsl(220 25% 10%) 0%, hsl(220 20% 8%) 100%)`
- **Cards:** `linear-gradient(135deg, hsl(220 18% 13%), hsl(220 18% 10%))`
- **Primary Glow:** `linear-gradient(135deg, hsl(199 89% 48%), hsl(172 66% 50%))`

### 💡 Glows (Sombra Neon)
Utilizados para indicar interatividade ou status crítico:
- **Primary Glow:** `0 0 20px hsl(199 89% 48% / 0.3)`
- **Success Glow:** `0 0 20px hsl(142 71% 45% / 0.3)`
- **Danger Glow:** `0 0 20px hsl(0 72% 55% / 0.3)`

---

## 🛠️ Implementação em Código (Tailwind/CSS)

Para aplicar em novas apps, configure seu `tailwind.config.ts` ou `CSS` utilizando os tokens acima:

```css
/* Exemplo de aplicação em CSS Puro */
:root {
  --primary: 199 89% 48%;
  --clinical-teal: 172 66% 50%;
  --radius: 0.75rem;
}

.card-clinical {
  background: linear-gradient(135deg, hsl(220 18% 13%), hsl(220 18% 10%));
  border: 1px solid hsl(220 14% 18%);
  border-radius: var(--radius);
  color: hsl(210 20% 92%);
}
```

---

## 💡 Princípios de Design Recomendados
1. **Espaçamento Generoso:** Use `gap-6` ou `gap-8` entre seções para evitar poluição visual.
2. **Micro-Interações:** Adicione `transition-all duration-300` em botões e cards. Ao passar o mouse, aumente levemente o brilho ou use `active:scale-95`.
3. **Ícones Leves:** Utilize bibliotecas como `Lucide React` com espessura de linha `stroke-width={1.5}` para manter a elegância.
