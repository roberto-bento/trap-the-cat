import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOARD_SIZE = 11;
const CAT_START = { r: 5, c: 5 };

export default function App() {
  const [board, setBoard] = useState([]);
  const [catPosition, setCatPosition] = useState(CAT_START);
  const [scores, setScores] = useState({ cat: 0, cpu: 0 });
  const [loading, setLoading] = useState(true);

  // Load scores on mount
  useEffect(() => {
    const loadScores = async () => {
      try {
        const saved = await AsyncStorage.getItem('trap_the_cat_scores');
        if (saved) {
          setScores(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load scores', e);
      } finally {
        setLoading(false);
      }
    };
    loadScores();
    resetGame();
  }, []);

  // Reset the game board
  const resetGame = () => {
    const newBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));

    // Generate between 9 and 15 random blocked cells (fences)
    const numBlocks = Math.floor(Math.random() * (15 - 9 + 1)) + 9;
    let placed = 0;
    while (placed < numBlocks) {
      const r = Math.floor(Math.random() * BOARD_SIZE);
      const c = Math.floor(Math.random() * BOARD_SIZE);
      // Fences cannot block the cat's start position or be duplicate
      if ((r === CAT_START.r && c === CAT_START.c) || newBoard[r][c] === 1) {
        continue;
      }
      newBoard[r][c] = 1;
      placed++;
    }

    setBoard(newBoard);
    setCatPosition(CAT_START);
  };

  // Reset both game and scoreboard
  const resetScoreboard = async () => {
    Alert.alert(
      "Confirmar Reset",
      "Deseja realmente zerar o placar de vitórias?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, zerar",
          style: "destructive",
          onPress: async () => {
            const newScores = { cat: 0, cpu: 0 };
            setScores(newScores);
            await AsyncStorage.setItem('trap_the_cat_scores', JSON.stringify(newScores));
          }
        }
      ]
    );
  };

  // Odd-r Hexagonal Neighbors
  const getNeighbors = (r, c) => {
    const neighbors = [];
    // Left and Right are always adjacent
    neighbors.push({ r, c: c - 1 });
    neighbors.push({ r, c: c + 1 });

    if (r % 2 !== 0) {
      // Odd row (shifted right)
      neighbors.push({ r: r - 1, c });         // Up-Left
      neighbors.push({ r: r - 1, c: c + 1 });   // Up-Right
      neighbors.push({ r: r + 1, c });         // Down-Left
      neighbors.push({ r: r + 1, c: c + 1 });   // Down-Right
    } else {
      // Even row (not shifted)
      neighbors.push({ r: r - 1, c: c - 1 });   // Up-Left
      neighbors.push({ r: r - 1, c });         // Up-Right
      neighbors.push({ r: r + 1, c: c - 1 });   // Down-Left
      neighbors.push({ r: r + 1, c });         // Down-Right
    }
    // Filter coordinates within the 11x11 board bounds
    return neighbors.filter(n => n.r >= 0 && n.r < BOARD_SIZE && n.c >= 0 && n.c < BOARD_SIZE);
  };

  // BFS to find the shortest path from a start cell to any border cell
  const findShortestPathToBorder = (start, currentBoard) => {
    // If starting neighbor is already on the border, distance to border is 0
    if (start.r === 0 || start.r === BOARD_SIZE - 1 || start.c === 0 || start.c === BOARD_SIZE - 1) {
      return 0;
    }

    const queue = [{ r: start.r, c: start.c, dist: 0 }];
    const visited = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
    visited[start.r][start.c] = true;

    let head = 0;
    while (head < queue.length) {
      const curr = queue[head++];

      // Found the border
      if (curr.r === 0 || curr.r === BOARD_SIZE - 1 || curr.c === 0 || curr.c === BOARD_SIZE - 1) {
        return curr.dist;
      }

      const neighbors = getNeighbors(curr.r, curr.c);
      for (const nb of neighbors) {
        // Must be empty and not visited
        if (currentBoard[nb.r][nb.c] === 0 && !visited[nb.r][nb.c]) {
          visited[nb.r][nb.c] = true;
          queue.push({ r: nb.r, c: nb.c, dist: curr.dist + 1 });
        }
      }
    }
    return Infinity; // No path to border exists
  };

  // BFS flood-fill to find the total reachable empty cells from a cell
  const getReachableComponentSize = (start, currentBoard) => {
    const queue = [{ r: start.r, c: start.c }];
    const visited = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
    visited[start.r][start.c] = true;

    let count = 0;
    let head = 0;
    while (head < queue.length) {
      const curr = queue[head++];
      count++;

      const neighbors = getNeighbors(curr.r, curr.c);
      for (const nb of neighbors) {
        if (currentBoard[nb.r][nb.c] === 0 && !visited[nb.r][nb.c]) {
          visited[nb.r][nb.c] = true;
          queue.push({ r: nb.r, c: nb.c });
        }
      }
    }
    return count;
  };

  // CPU AI: choose an empty cell to block
  const chooseCPUBlock = (catPos, currentBoard) => {
    // Candidates are the empty cells adjacent to the cat
    const emptyNeighbors = getNeighbors(catPos.r, catPos.c).filter(
      nb => currentBoard[nb.r][nb.c] === 0
    );

    if (emptyNeighbors.length === 0) {
      // Cat is trapped, but game hasn't registered it yet. Choose any empty cell on board
      const allEmpty = [];
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (currentBoard[r][c] === 0 && !(r === catPos.r && c === catPos.c)) {
            allEmpty.push({ r, c });
          }
        }
      }
      if (allEmpty.length === 0) return null;
      return allEmpty[Math.floor(Math.random() * allEmpty.length)];
    }

    // For each empty neighbor, find the shortest distance to a border
    const paths = emptyNeighbors.map(nb => ({
      nb,
      dist: findShortestPathToBorder(nb, currentBoard)
    }));

    // Separate escapable neighbors from closed-off neighbors
    const escapable = paths.filter(p => p.dist !== Infinity);

    if (escapable.length > 0) {
      // Block the neighbor that has the absolute shortest path to escape
      escapable.sort((a, b) => a.dist - b.dist);
      return escapable[0].nb;
    } else {
      // The cat is already closed off from the borders.
      // Choose the neighbor that leads to the largest space (component size) to shrink it down.
      const sizes = emptyNeighbors.map(nb => ({
        nb,
        size: getReachableComponentSize(nb, currentBoard)
      }));
      sizes.sort((a, b) => b.size - a.size); // descending size
      return sizes[0].nb;
    }
  };

  // Handle player tapping a cell
  const handleCellPress = async (r, c) => {
    // Guard clauses
    if (board[r][c] === 1) return; // Cannot step on a fence
    if (r === catPosition.r && c === catPosition.c) return; // Already on this cell

    // Verify cell is adjacent to the Gato
    const neighbors = getNeighbors(catPosition.r, catPosition.c);
    const isAdjacent = neighbors.some(nb => nb.r === r && nb.c === c);
    if (!isAdjacent) return; // Do nothing if click is invalid

    // 1. Move Cat to target
    const newCatPos = { r, c };
    setCatPosition(newCatPos);

    // Check if Gato escaped (reached any border cell)
    if (r === 0 || r === BOARD_SIZE - 1 || c === 0 || c === BOARD_SIZE - 1) {
      const newScores = { ...scores, cat: scores.cat + 1 };
      setScores(newScores);
      await AsyncStorage.setItem('trap_the_cat_scores', JSON.stringify(newScores));

      Alert.alert(
        "O Gato Escapou! 🐱🏆",
        "Parabéns! O Gato alcançou a borda do tabuleiro e conseguiu fugir.",
        [{ text: "Jogar Novamente", onPress: resetGame }]
      );
      return;
    }

    // 2. CPU Turn: Cerca blocks a cell immediately after
    const cpuBlock = chooseCPUBlock(newCatPos, board);
    const updatedBoard = board.map(row => [...row]);
    if (cpuBlock) {
      updatedBoard[cpuBlock.r][cpuBlock.c] = 1;
      setBoard(updatedBoard);
    }

    // 3. Check if Gato is completely trapped (CPU wins!)
    const activeNeighbors = getNeighbors(newCatPos.r, newCatPos.c);
    const emptyNeighbors = activeNeighbors.filter(nb => updatedBoard[nb.r][nb.c] === 0);

    if (emptyNeighbors.length === 0) {
      const newScores = { ...scores, cpu: scores.cpu + 1 };
      setScores(newScores);
      await AsyncStorage.setItem('trap_the_cat_scores', JSON.stringify(newScores));

      Alert.alert(
        "Gato Encurralado! 🛑🤖",
        "A Cerca bloqueou com sucesso todos os movimentos do Gato!",
        [{ text: "Jogar Novamente", onPress: resetGame }]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3A2C5D" />
      </View>
    );
  }

  // Calculate dynamic size of hexagon-circles
  const { width: screenWidth } = Dimensions.get('window');
  const BOARD_PADDING = 20;
  const AVAILABLE_WIDTH = screenWidth - BOARD_PADDING * 2;
  const CELL_SIZE = Math.floor(AVAILABLE_WIDTH / 11.5);
  const CELL_MARGIN = 2;
  const CELL_DIAMETER = CELL_SIZE - CELL_MARGIN;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Title Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pegue o Gato</Text>
        <Text style={styles.subtitle}>
          Ajude o Gato a fugir pelas bordas, ou bloqueie-o como a Cerca!
        </Text>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreEmoji}>🐱</Text>
          <Text style={styles.scoreLabel}>Gato (Você)</Text>
          <Text style={styles.scoreValue}>{scores.cat}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.scoreBox}>
          <Text style={styles.scoreEmoji}>🛑</Text>
          <Text style={styles.scoreLabel}>Cerca (CPU)</Text>
          <Text style={styles.scoreValue}>{scores.cpu}</Text>
        </View>
      </View>

      {/* Hexagonal circular game grid */}
      <View style={styles.gameArea}>
        <View style={[styles.boardContainer, { width: 11.5 * CELL_SIZE }]}>
          {board.map((row, r) => (
            <View
              key={r}
              style={[
                styles.row,
                {
                  height: CELL_SIZE * 0.9, // Offset row heights slightly for honeycomb compression
                  marginLeft: r % 2 !== 0 ? CELL_SIZE / 2 : 0 // Odd-r displacement
                }
              ]}
            >
              {row.map((cell, c) => {
                const isCat = catPosition.r === r && catPosition.c === c;
                const isBlocked = cell === 1;

                // Color variables as specified:
                // Empty = Light Lime Green, Blocked = Olive Green, Cat = Black
                let cellColor = '#CCFF00';
                if (isBlocked) {
                  cellColor = '#4A5D23';
                } else if (isCat) {
                  cellColor = '#000000';
                }

                return (
                  <TouchableOpacity
                    key={c}
                    activeOpacity={0.8}
                    onPress={() => handleCellPress(r, c)}
                    disabled={isBlocked || isCat}
                    style={[
                      styles.cell,
                      {
                        width: CELL_DIAMETER,
                        height: CELL_DIAMETER,
                        borderRadius: CELL_DIAMETER / 2,
                        backgroundColor: cellColor,
                        marginHorizontal: CELL_MARGIN / 2,
                      }
                    ]}
                  >
                    {isCat && (
                      <Text style={{ fontSize: CELL_DIAMETER * 0.6 }}>🐱</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Action buttons footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.restartButton} onPress={resetGame}>
          <Text style={styles.restartButtonText}>Reiniciar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetScoresButton} onPress={resetScoreboard}>
          <Text style={styles.resetScoresButtonText}>Zerar Placar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAE5F8', // Soft lilac background
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#EAE5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#2C1D4D',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#65578C',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  scoreboard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '90%',
    maxWidth: 360,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#2C1D4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    marginVertical: 10,
  },
  scoreBox: {
    alignItems: 'center',
    flex: 1,
  },
  scoreEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#65578C',
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C1D4D',
    marginTop: 4,
  },
  divider: {
    width: 1.5,
    height: '75%',
    backgroundColor: '#D1C8EC',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  boardContainer: {
    alignSelf: 'center',
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 2.2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    paddingBottom: 28,
    gap: 16,
  },
  restartButton: {
    backgroundColor: '#2C1D4D',
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 30,
    shadowColor: '#2C1D4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 4,
  },
  restartButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetScoresButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2C1D4D',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  resetScoresButtonText: {
    color: '#2C1D4D',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

