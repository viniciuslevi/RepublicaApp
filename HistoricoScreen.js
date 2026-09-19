// src/screens/HistoricoScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import FiltroHistoricoModal from '../components/FiltroHistoricoModal';

export default function HistoricoScreen() {
  const [historico, setHistorico] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    moradorId: '',
    dataInicio: '',
    dataFim: '',
  });

  useEffect(() => {
    carregarMoradores();
  }, []);

  useEffect(() => {
    carregarHistorico();
  }, [filtros]);

  const carregarMoradores = async () => {
    // Substituir pela chamada real à API
    setMoradores([
      { id: '1', nome: 'João' },
      { id: '2', nome: 'Maria' },
    ]);
  };

  const carregarHistorico = async () => {
    setLoading(true);
    try {
      // Constrói os query params
      const params = new URLSearchParams();
      if (filtros.tipo && filtros.tipo !== 'todos') params.append('tipo', filtros.tipo);
      if (filtros.moradorId) params.append('moradorId', filtros.moradorId);
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim);

      const response = await fetch(`https://api.republicaapp.com/historico?${params.toString()}`);
      const data = await response.json();
      setHistorico(data.data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Nenhum registro encontrado</Text>
      <Text style={styles.emptySubtitle}>
        Não encontramos tarefas ou despesas para os filtros selecionados.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Cabeçalho de Filtros */}
      <View style={styles.header}>
        <Text style={styles.title}>Histórico</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.filterBtnText}>🔍 Filtrar</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de registros */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={historico}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={renderEmptyState}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardType}>{item.tipo.toUpperCase()}</Text>
                <Text style={styles.cardDate}>
                  {new Date(item.data || item.created_at).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              <Text style={styles.cardTitle}>{item.titulo}</Text>
              <Text style={styles.cardMorador}>Morador: {item.moradorNome || item.moradorId}</Text>
            </View>
          )}
        />
      )}

      {/* Modal de Filtros */}
      <FiltroHistoricoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onApply={(novosFiltros) => setFiltros(novosFiltros)}
        moradores={moradores}
        filtrosAtuais={filtros}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 22, fontWeight: 'bold' },
  filterBtn: { backgroundColor: '#007AFF', padding: 8, borderRadius: 8 },
  filterBtnText: { color: '#FFF', fontWeight: 'bold' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  cardType: { fontSize: 12, fontWeight: 'bold', color: '#007AFF' },
  cardDate: { fontSize: 12, color: '#888' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardMorador: { fontSize: 13, color: '#555', marginTop: 4 },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 5 },
});