# Pegue o Gato (Trap the Cat)

Projeto de jogo de raciocínio lógico e estratégia desenvolvido em **React Native** (utilizando **Expo**). 

Nesta versão do clássico jogo "Trap the Cat", a dinâmica tradicional foi invertida: **o usuário controla o Gato** (com o objetivo de escapar), enquanto a **CPU controla a Cerca** (com o objetivo de encurralar o gato, utilizando o algoritmo de Busca em Largura - BFS).

## Como Jogar e Regras

O tabuleiro é composto por uma malha de dimensões 11x11, renderizada através de um layout visual que simula um tabuleiro **hexagonal** (mediante o deslocamento horizontal das linhas ímpares). 

- **O Gato (Usuário):** Inicia a partida no centro exato do tabuleiro (linha 5, coluna 5). O objetivo principal é alcançar qualquer uma das bordas (extremos da matriz).
- **A Cerca (CPU):** O estado inicial do jogo conta com 9 a 15 casas bloqueadas de forma aleatória. A cada movimento do jogador, a CPU bloqueia uma nova casa, calculando a rota mais eficiente para interceptar a fuga do gato.
- **Movimentação:** A movimentação do gato é restrita a casas **vazias** que sejam **imediatamente adjacentes** à sua posição atual.
- **Condições de Fim de Jogo:** A vitória do usuário ocorre caso o gato alcance uma das bordas. A vitória da CPU ocorre caso o gato fique sem casas adjacentes vazias disponíveis para movimentação. O placar geral é cumulativo e mantido no armazenamento local do dispositivo.

## Tecnologias Utilizadas

- **React Native:** Desenvolvimento da interface e lógica do aplicativo.
- **Expo:** Gerenciamento do ambiente de desenvolvimento e build.
- **AsyncStorage:** Persistência de dados locais para manutenção do placar.
- **Algoritmo de Busca em Largura (BFS):** Inteligência Artificial empregada na CPU para cálculo de rotas e bloqueios otimizados.

## Pré-requisitos

Para executar este projeto, é necessário possuir os seguintes requisitos no ambiente de desenvolvimento:
- [Node.js](https://nodejs.org/en/) (versão LTS recomendada).
- Gerenciador de pacotes (NPM, Yarn ou Bun).
- Aplicativo **Expo Go** instalado em um dispositivo móvel (Android/iOS), ou um emulador devidamente configurado na máquina.

## Instalação e Execução

Siga as instruções abaixo para inicializar o projeto em seu ambiente local:

**1. Clone o repositório e acesse a pasta do projeto:**
```bash
cd trap-the-cat

```

**2. Instale as dependências do projeto:**

```bash
npm install
# ou
yarn install

```

**3. Inicie o servidor local do Expo:**

```bash
npx expo start

```

**4. Execute o aplicativo:**

* Abra o aplicativo **Expo Go** em seu dispositivo móvel.
* Escaneie o **QR Code** gerado no terminal ou na interface do navegador.
* Aguarde o carregamento do bundle para iniciar a aplicação.

### Como rodar via Android Studio (Build Nativo)

Como este projeto utiliza **Expo Prebuild** para gerar as pastas nativas, você pode abri-lo e compilá-lo diretamente no Android Studio.

**1. Abra o Android Studio pelo Terminal (Para usuários de NVM no macOS):**
Para garantir que o Android Studio reconheça o seu Node.js via NVM, feche o Android Studio completamente (`Cmd + Q`) e abra-o pelo seu terminal:
```bash
open -a "Android Studio"
```

**2. Importe o Projeto:**
No Android Studio, clique em `Open` e selecione a pasta `android` localizada dentro do projeto (`trap-the-cat/react-native-to-android/android`).

**3. Sincronize o Gradle:**
Aguarde a sincronização inicial. Caso apareça algum aviso sobre a versão do Android Gradle Plugin (AGP), saiba que o projeto já foi adaptado para rodar na versão `8.7.2` (ou compatível com seu IDE).

**4. Compile e instale no dispositivo:**
Com seu celular conectado via USB (ou um Emulador aberto), clique no botão **Play (Run 'app')** na barra superior do Android Studio.

**5. Inicie o Metro Bundler:**
Após a instalação, o aplicativo abrirá no celular com uma tela informando que precisa do servidor Metro. Deixe o app aberto, volte ao terminal do computador, navegue até a raiz do projeto e inicie o bundler:
```bash
pnpm start
```
*Dica:* Quando o servidor iniciar, pressione a letra `a` no terminal. O Expo executará o `adb reverse` automaticamente, conectando seu celular ao servidor JavaScript do Mac via cabo USB!

## Lógica Destacada (Implementação do Tabuleiro Hexagonal)

Tendo em vista que o React Native não oferece suporte nativo imediato para geometrias hexagonais complexas sem o uso de bibliotecas de terceiros (como SVG), a solução adotada consiste em uma matriz bidimensional padrão (11x11) associada a um deslocamento visual (`marginLeft`) aplicado estritamente às **linhas ímpares**.

Sob o ponto de vista matemático, esta abordagem altera o cálculo de verificação de vizinhança (sistema de coordenadas *Odd-r*), garantindo que a movimentação em 6 direções ocorra de maneira precisa, utilizando componentes esféricos básicos para a composição visual.
