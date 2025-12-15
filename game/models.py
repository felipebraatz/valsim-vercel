from django.db import models

class Team(models.Model):
    REGIONS = [
        ('AMERICAS', 'Americas'),
        ('EMEA', 'EMEA'),
        ('PACIFIC', 'Pacific'),
        ('CHINA', 'China'),
    ]
    
    name = models.CharField(max_length=100)
    short_name = models.CharField(max_length=10)
    region = models.CharField(max_length=20, choices=REGIONS, default='AMERICAS')
    color_primary = models.CharField(max_length=7, default='#000000') # Hex code
    color_secondary = models.CharField(max_length=7, default='#ffffff')
    logo = models.ImageField(upload_to='teams/', blank=True, null=True)
    
    class Meta:
        ordering = ['region', 'name']
    
    def calculate_team_overall(self):
        """
        Calcula o Overall do time dinamicamente baseado nos 5 primeiros jogadores.
        Retorna a média dos overall ratings dos top 5 jogadores.
        """
        players = self.players.all()[:5]
        if not players:
            return 0
        
        player_ratings = [p.calculate_overall() for p in players]
        return int(sum(player_ratings) / len(player_ratings))
    
    def __str__(self):
        return self.name

class Player(models.Model):
    ROLES = [
        ('DUELIST', 'Duelist'),
        ('INITIATOR', 'Initiator'),
        ('CONTROLLER', 'Controller'),
        ('SENTINEL', 'Sentinel'),
    ]
    
    name = models.CharField(max_length=100)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='players')
    role = models.CharField(max_length=20, choices=ROLES)
    rating = models.IntegerField(default=75) # 0-100
    photo = models.ImageField(upload_to='players/', blank=True, null=True)
    
    # Player Attributes (1-20 scale)
    aim = models.IntegerField(default=10)  # Mechanical skill
    gamesense = models.IntegerField(default=10)  # Tactical IQ / Game sense
    support = models.IntegerField(default=10)  # Utility & teamplay
    clutch = models.IntegerField(default=10)  # Performance under pressure
    mental = models.IntegerField(default=10)  # Mental strength / resilience
    
    def calculate_overall(self):
        """
        Calcula o Overall (0-99) baseado na Role do jogador.
        Atributos de entrada: 1-20.
        """
        # Pesos por Role (A soma deve dar 1.0)
        weights = {
            'DUELIST': {
                'aim': 0.55,        # Mira é extremamente crucial
                'gamesense': 0.20,  # Posicionamento
                'mental': 0.10,     # Padronizado
                'support': 0.10,    # Menos importante
                'clutch': 0.05      # Reduzido
            },
            'CONTROLLER': {
                'aim': 0.40,        # Mira muito importante agora
                'gamesense': 0.25,  # Fumos/Posicionamento
                'support': 0.20,    # Ajudar o time
                'mental': 0.10,     # Padronizado
                'clutch': 0.05      # Reduzido
            },
            'INITIATOR': {
                'aim': 0.40,        # Mira muito importante
                'support': 0.30,    # Utilitário é o principal
                'gamesense': 0.15,  # Info
                'mental': 0.10,     # Padronizado
                'clutch': 0.05      # Reduzido
            },
            'SENTINEL': {
                'aim': 0.50,        # Segurar bomb/mecânica muito importante
                'gamesense': 0.25,  # Leitura de jogo/Lurk
                'mental': 0.10,     # Padronizado
                'support': 0.10,    # Menos importante
                'clutch': 0.05      # Reduzido
            },
            'FLEX': {  # Balanceado
                'aim': 0.20,
                'gamesense': 0.20,
                'support': 0.20,
                'mental': 0.20,
                'clutch': 0.20
            }
        }

        # Pega os pesos da role do jogador (fallback para Flex)
        w = weights.get(self.role, weights['FLEX'])

        # 1. Calcula a média ponderada (Resultado será entre 1 e 20)
        weighted_score = (
            (self.aim * w.get('aim', 0)) +
            (self.gamesense * w.get('gamesense', 0)) +
            (self.support * w.get('support', 0)) +
            (self.clutch * w.get('clutch', 0)) +
            (self.mental * w.get('mental', 0))
        )

        # 2. Converte escala 1-20 para 0-99 (FIFA Style)
        # Jogadores pro geralmente ficam entre 10-18 de atributo.
        # Vamos mapear:
        # Média 10 (Regular) -> Overall 75
        # Média 15 (Craque) -> Overall 88
        # Média 20 (Lenda) -> Overall 99
        
        # Fórmula de Conversão: Base 50 + (Score * 2.45)
        # Ex: Score 10 * 2.45 = 24.5 + 50 = 74.5
        # Ex: Score 18 * 2.45 = 44.1 + 50 = 94.1
        
        overall = 50 + (weighted_score * 2.45)
        
        # Clamp para garantir que fique entre 40 e 99
        return int(max(40, min(99, overall)))
    
    def __str__(self):
        return f"{self.name} ({self.team.short_name})"

class Championship(models.Model):
    name = models.CharField(max_length=100)
    logo = models.ImageField(upload_to='championships/', blank=True, null=True)

    def __str__(self):
        return self.name

class Map(models.Model):
    name = models.CharField(max_length=50)
    minimap = models.ImageField(upload_to='maps/', blank=True, null=True)

    def __str__(self):
        return self.name

class Match(models.Model):
    team_a = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='matches_as_a')
    team_b = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='matches_as_b')
    score_a = models.IntegerField(default=0)
    score_b = models.IntegerField(default=0)
    winner = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, related_name='won_matches')
    format = models.CharField(max_length=10) # BO1, BO3, BO5
    map_name = models.CharField(max_length=50) # Legacy, keep for now
    map = models.ForeignKey(Map, on_delete=models.SET_NULL, null=True, blank=True)
    championship = models.ForeignKey(Championship, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.team_a} vs {self.team_b} ({self.score_a}-{self.score_b})"
