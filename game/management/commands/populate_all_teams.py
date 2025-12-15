"""
Comando Django para popular o banco de dados com TODAS as 50 equipes e jogadores
Database completa convertida de TypeScript com atributos em escala 1-20
"""

from django.core.management.base import BaseCommand
from game.models import Team, Player
from django.db import transaction
import sys
import os

# Adicionar o diretório do projeto ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Importar stats convertidos
try:
    # Tentar importar do arquivo gerado
    with open('player_stats_converted.py', 'r', encoding='utf-8') as f:
        exec(f.read(), globals())
except FileNotFoundError:
    print("❌ Arquivo player_stats_converted.py não encontrado!")
    print("   Execute primeiro: python convert_teams.py")
    PLAYER_STATS = {}

# Dados completos das 50 equipes (extraídos de teams.ts)
TEAMS_DATA = {
    # Americas
    'Sentinels': {
        'region': 'AMERICAS',
        'short_name': 'SEN',
        'color_primary': '#C41E3A',
        'players': [
            {'name': 'N4RRATE', 'role': 'INITIATOR'},
            {'name': 'zekken', 'role': 'DUELIST'},
            {'name': 'johnqt', 'role': 'SENTINEL'},
            {'name': 'bang', 'role': 'CONTROLLER'},
            {'name': 'Zellsis', 'role': 'FLEX'},
        ]
    },
    'G2 Esports': {
        'region': 'AMERICAS',
        'short_name': 'G2',
        'color_primary': '#FF4655',
        'players': [
            {'name': 'leaf', 'role': 'SENTINEL'},
            {'name': 'trent', 'role': 'INITIATOR'},
            {'name': 'jawgemo', 'role': 'DUELIST'},
            {'name': 'valyn', 'role': 'CONTROLLER'},
            {'name': 'JonahP', 'role': 'FLEX'},
        ]
    },
    'Cloud9': {
        'region': 'AMERICAS',
        'short_name': 'C9',
        'color_primary': '#0080FF',
        'players': [
            {'name': 'oxy', 'role': 'DUELIST'},
            {'name': 'v1c', 'role': 'CONTROLLER'},
            {'name': 'Xeppaa', 'role': 'FLEX'},
            {'name': 'mitch', 'role': 'INITIATOR'},
            {'name': 'neT', 'role': 'SENTINEL'},
        ]
    },
    'Evil Geniuses': {
        'region': 'AMERICAS',
        'short_name': 'EG',
        'color_primary': '#0D2447',
        'players': [
            {'name': 'NaturE', 'role': 'INITIATOR'},
            {'name': 'Derrek', 'role': 'SENTINEL'},
            {'name': 'yay', 'role': 'FLEX'},
            {'name': 'supamen', 'role': 'CONTROLLER'},
            {'name': 'icy', 'role': 'DUELIST'},
        ]
    },
    '2Game Esports': {
        'region': 'AMERICAS',
        'short_name': '2G',
        'color_primary': '#FF6B00',
        'players': [
            {'name': 'silentzz', 'role': 'DUELIST'},
            {'name': 'gobera', 'role': 'SENTINEL'},
            {'name': 'pryze', 'role': 'INITIATOR'},
            {'name': 'spike', 'role': 'FLEX'},
            {'name': 'lz', 'role': 'CONTROLLER'},
        ]
    },
    'FURIA': {
        'region': 'AMERICAS',
        'short_name': 'FUR',
        'color_primary': '#000000',
        'players': [
            {'name': 'heat', 'role': 'SENTINEL'},
            {'name': 'basic', 'role': 'INITIATOR'},
            {'name': 'Urango', 'role': 'FLEX'},
            {'name': 'tuyz', 'role': 'CONTROLLER'},
            {'name': 'palla', 'role': 'DUELIST'},
        ]
    },
    'NRG': {
        'region': 'AMERICAS',
        'short_name': 'NRG',
        'color_primary': '#000000',
        'players': [
            {'name': 'skuba', 'role': 'SENTINEL'},
            {'name': 'brawk', 'role': 'INITIATOR'},
            {'name': 'Ethan', 'role': 'FLEX'},
            {'name': 'mada', 'role': 'DUELIST'},
            {'name': 's0m', 'role': 'CONTROLLER'},
        ]
    },
    '100 Thieves': {
        'region': 'AMERICAS',
        'short_name': '100T',
        'color_primary': '#FF0000',
        'players': [
            {'name': 'Asuna', 'role': 'DUELIST'},
            {'name': 'Cryocells', 'role': 'FLEX'},
            {'name': 'eeiu', 'role': 'INITIATOR'},
            {'name': 'Kess', 'role': 'SENTINEL'},
            {'name': 'zander', 'role': 'CONTROLLER'},
        ]
    },
    'Leviatán': {
        'region': 'AMERICAS',
        'short_name': 'LEV',
        'color_primary': '#702D8E',
        'players': [
            {'name': 'Kingg', 'role': 'CONTROLLER'},
            {'name': 'okeanos', 'role': 'FLEX'},
            {'name': 'C0M', 'role': 'INITIATOR'},
            {'name': 'Sato', 'role': 'DUELIST'},
            {'name': 'tex', 'role': 'SENTINEL'},
        ]
    },
    'KRÜ Esports': {
        'region': 'AMERICAS',
        'short_name': 'KRU',
        'color_primary': '#FF0062',
        'players': [
            {'name': 'Dantedeu5', 'role': 'FLEX'},
            {'name': 'Shyy', 'role': 'SENTINEL'},
            {'name': 'keznit', 'role': 'DUELIST'},
            {'name': 'Mazino', 'role': 'INITIATOR'},
            {'name': 'Melser', 'role': 'CONTROLLER'},
        ]
    },
    'LOUD': {
        'region': 'AMERICAS',
        'short_name': 'LOUD',
        'color_primary': '#00FF87',
        'players': [
            {'name': 'Lukxo', 'role': 'SENTINEL'},
            {'name': 'pANcada', 'role': 'CONTROLLER'},
            {'name': 'cauanzin', 'role': 'FLEX'},
            {'name': 'Virtyy', 'role': 'DUELIST'},
            {'name': 'RobbieBk', 'role': 'INITIATOR'},
        ]
    },
    'MIBR': {
        'region': 'AMERICAS',
        'short_name': 'MIBR',
        'color_primary': '#FF8C00',
        'players': [
            {'name': 'aspas', 'role': 'DUELIST'},
            {'name': 'cortezia', 'role': 'SENTINEL'},
            {'name': 'xenom', 'role': 'CONTROLLER'},
            {'name': 'artzin', 'role': 'FLEX'},
            {'name': 'Verno', 'role': 'INITIATOR'},
        ]
    },
    # EMEA
    'Team Heretics': {
        'region': 'EMEA',
        'short_name': 'TH',
        'color_primary': '#FF4655',
        'players': [
            {'name': 'Boo', 'role': 'CONTROLLER'},
            {'name': 'MiniBoo', 'role': 'DUELIST'},
            {'name': 'Wo0t', 'role': 'FLEX'},
            {'name': 'RieNs', 'role': 'INITIATOR'},
            {'name': 'benjyfishy', 'role': 'SENTINEL'},
        ]
    },
    'GiantX': {
        'region': 'EMEA',
        'short_name': 'GX',
        'color_primary': '#FF6B00',
        'players': [
            {'name': 'Flickless', 'role': 'FLEX'},
            {'name': 'ara', 'role': 'DUELIST'},
            {'name': 'Cloud', 'role': 'INITIATOR'},
            {'name': 'westside', 'role': 'SENTINEL'},
            {'name': 'GRUBINHO', 'role': 'CONTROLLER'},
        ]
    },
    'BBL Esports': {
        'region': 'EMEA',
        'short_name': 'BBL',
        'color_primary': '#FF6600',
        'players': [
            {'name': 'MAGNUM', 'role': 'SENTINEL'},
            {'name': 'PROFEK', 'role': 'CONTROLLER'},
            {'name': 'LêwN', 'role': 'DUELIST'},
            {'name': 'Jamppi', 'role': 'FLEX'},
            {'name': 'sociablEE', 'role': 'INITIATOR'},
        ]
    },
    'Team Vitality': {
        'region': 'EMEA',
        'short_name': 'VIT',
        'color_primary': '#FFB800',
        'players': [
            {'name': 'UNFAKE', 'role': 'INITIATOR'},
            {'name': 'Derke', 'role': 'DUELIST'},
            {'name': 'Kicks', 'role': 'CONTROLLER'},
            {'name': 'Less', 'role': 'SENTINEL'},
            {'name': 'KovaQ', 'role': 'FLEX'},
        ]
    },
    'FUT Esports': {
        'region': 'EMEA',
        'short_name': 'FUT',
        'color_primary': '#FF4655',
        'players': [
            {'name': 'qRaxs', 'role': 'FLEX'},
            {'name': 'cNed', 'role': 'CONTROLLER'},
            {'name': 'MrFaliN', 'role': 'INITIATOR'},
            {'name': 'yetujey', 'role': 'SENTINEL'},
            {'name': 'xeus', 'role': 'DUELIST'},
        ]
    },
    'Gentle Mates': {
        'region': 'EMEA',
        'short_name': 'M8',
        'color_primary': '#9D4EDD',
        'players': [
            {'name': 'kamyk', 'role': 'FLEX'},
            {'name': 'Minny', 'role': 'SENTINEL'},
            {'name': 'ComeBack', 'role': 'DUELIST'},
            {'name': 'Proxh', 'role': 'CONTROLLER'},
            {'name': 'Veqaj', 'role': 'INITIATOR'},
        ]
    },
    'Team Liquid': {
        'region': 'EMEA',
        'short_name': 'TL',
        'color_primary': '#0E2D52',
        'players': [
            {'name': 'keiko', 'role': 'CONTROLLER'},
            {'name': 'paTiTek', 'role': 'FLEX'},
            {'name': 'Trexx', 'role': 'INITIATOR'},
            {'name': 'kamo', 'role': 'DUELIST'},
            {'name': 'nAts', 'role': 'SENTINEL'},
        ]
    },
    'Fnatic': {
        'region': 'EMEA',
        'short_name': 'FNC',
        'color_primary': '#FF5900',
        'players': [
            {'name': 'Chronicle', 'role': 'FLEX'},
            {'name': 'crashies', 'role': 'INITIATOR'},
            {'name': 'Alfajer', 'role': 'SENTINEL'},
            {'name': 'kaajak', 'role': 'DUELIST'},
            {'name': 'Boaster', 'role': 'CONTROLLER'},
        ]
    },
    'Natus Vincere': {
        'region': 'EMEA',
        'short_name': 'NAVI',
        'color_primary': '#FFE600',
        'players': [
            {'name': 'Shao', 'role': 'FLEX'},
            {'name': 'Ruxic', 'role': 'CONTROLLER'},
            {'name': 'alexiiik', 'role': 'DUELIST'},
            {'name': 'hiro', 'role': 'SENTINEL'},
            {'name': 'ANGE1', 'role': 'INITIATOR'},
        ]
    },
    'Karmine Corp': {
        'region': 'EMEA',
        'short_name': 'KC',
        'color_primary': '#1E88E5',
        'players': [
            {'name': 'suygetsu', 'role': 'CONTROLLER'},
            {'name': 'marteen', 'role': 'DUELIST'},
            {'name': 'pyrolll', 'role': 'INITIATOR'},
            {'name': 'Avez', 'role': 'FLEX'},
            {'name': 'saadhak', 'role': 'SENTINEL'},
        ]
    },
    'Movistar KOI': {
        'region': 'EMEA',
        'short_name': 'KOI',
        'color_primary': '#FF4655',
        'players': [
            {'name': 'baddyG', 'role': 'CONTROLLER'},
            {'name': 'MONSTEERR', 'role': 'SENTINEL'},
            {'name': 'flyuh', 'role': 'INITIATOR'},
            {'name': 'Filu', 'role': 'FLEX'},
            {'name': 'nataNk', 'role': 'DUELIST'},
        ]
    },
    'Apeks': {
        'region': 'EMEA',
        'short_name': 'APK',
        'color_primary': '#FF6B00',
        'players': [
            {'name': 'OLIZERA', 'role': 'SENTINEL'},
            {'name': 'penny', 'role': 'DUELIST'},
            {'name': 'MOLSI', 'role': 'INITIATOR'},
            {'name': 'AvovA', 'role': 'CONTROLLER'},
            {'name': 'batujnax', 'role': 'FLEX'},
        ]
    },
    # Pacific
    'DRX': {
        'region': 'PACIFIC',
        'short_name': 'DRX',
        'color_primary': '#1C3FAA',
        'players': [
            {'name': 'HYUNMIN', 'role': 'DUELIST'},
            {'name': 'free1ing', 'role': 'FLEX'},
            {'name': 'Flashback', 'role': 'SENTINEL'},
            {'name': 'BeYN', 'role': 'INITIATOR'},
            {'name': 'MaKo', 'role': 'CONTROLLER'},
        ]
    },
    'Rex Regum Qeon': {
        'region': 'PACIFIC',
        'short_name': 'RRQ',
        'color_primary': '#FF0000',
        'players': [
            {'name': 'xffero', 'role': 'SENTINEL'},
            {'name': 'Monyet', 'role': 'FLEX'},
            {'name': 'crazyguy', 'role': 'CONTROLLER'},
            {'name': 'Jemkin', 'role': 'DUELIST'},
            {'name': 'Kushy', 'role': 'INITIATOR'},
        ]
    },
    'Nongshim RedForce': {
        'region': 'PACIFIC',
        'short_name': 'NS',
        'color_primary': '#FF0000',
        'players': [
            {'name': 'Francis', 'role': 'FLEX'},
            {'name': 'Ivy', 'role': 'SENTINEL'},
            {'name': 'Persia', 'role': 'CONTROLLER'},
            {'name': 'Dambi', 'role': 'DUELIST'},
            {'name': 'Rb', 'role': 'INITIATOR'},
        ]
    },
    'Gen.G': {
        'region': 'PACIFIC',
        'short_name': 'GENG',
        'color_primary': '#AA8A00',
        'players': [
            {'name': 'Karon', 'role': 'CONTROLLER'},
            {'name': 't3xture', 'role': 'DUELIST'},
            {'name': 'Munchkin', 'role': 'FLEX'},
            {'name': 'Ash', 'role': 'INITIATOR'},
            {'name': 'Foxy9', 'role': 'SENTINEL'},
        ]
    },
    'Team Secret': {
        'region': 'PACIFIC',
        'short_name': 'TS',
        'color_primary': '#000000',
        'players': [
            {'name': 'invy', 'role': 'FLEX'},
            {'name': 'kellyS', 'role': 'SENTINEL'},
            {'name': 'n1zzyyy', 'role': 'DUELIST'},
            {'name': 'JessieVash', 'role': 'INITIATOR'},
            {'name': 'Wild0reoo', 'role': 'CONTROLLER'},
        ]
    },
    'Global Esports': {
        'region': 'PACIFIC',
        'short_name': 'GE',
        'color_primary': '#FFA500',
        'players': [
            {'name': 'Papi', 'role': 'CONTROLLER'},
            {'name': 'UdoTan', 'role': 'DUELIST'},
            {'name': 'Kr1stal', 'role': 'INITIATOR'},
            {'name': 'ban', 'role': 'FLEX'},
            {'name': 'yoman', 'role': 'SENTINEL'},
        ]
    },
    'Paper Rex': {
        'region': 'PACIFIC',
        'short_name': 'PRX',
        'color_primary': '#FF4655',
        'players': [
            {'name': 'f0rsakeN', 'role': 'FLEX'},
            {'name': 'd4v4i', 'role': 'SENTINEL'},
            {'name': 'something', 'role': 'DUELIST'},
            {'name': 'Jingg', 'role': 'CONTROLLER'},
            {'name': 'PatMen', 'role': 'INITIATOR'},
        ]
    },
    'Talon': {
        'region': 'PACIFIC',
        'short_name': 'TLN',
        'color_primary': '#0047AB',
        'players': [
            {'name': 'JitBoyS', 'role': 'SENTINEL'},
            {'name': 'thyy', 'role': 'CONTROLLER'},
            {'name': 'Killua', 'role': 'INITIATOR'},
            {'name': 'primmie', 'role': 'DUELIST'},
            {'name': 'Crws', 'role': 'FLEX'},
        ]
    },
    'T1': {
        'region': 'PACIFIC',
        'short_name': 'T1',
        'color_primary': '#E4002B',
        'players': [
            {'name': 'DH', 'role': 'CONTROLLER'},
            {'name': 'Meteor', 'role': 'SENTINEL'},
            {'name': 'iZu', 'role': 'DUELIST'},
            {'name': 'Buzz', 'role': 'FLEX'},
            {'name': 'stax', 'role': 'INITIATOR'},
        ]
    },
    'DetonatioN FocusMe': {
        'region': 'PACIFIC',
        'short_name': 'DFM',
        'color_primary': '#000000',
        'players': [
            {'name': 'Meiy', 'role': 'DUELIST'},
            {'name': 'Akame', 'role': 'CONTROLLER'},
            {'name': 'Jinboong', 'role': 'SENTINEL'},
            {'name': 'gyen', 'role': 'FLEX'},
            {'name': 'SSees', 'role': 'INITIATOR'},
        ]
    },
    'ZETA DIVISION': {
        'region': 'PACIFIC',
        'short_name': 'ZETA',
        'color_primary': '#00BFFF',
        'players': [
            {'name': 'Xdll', 'role': 'INITIATOR'},
            {'name': 'TenTen', 'role': 'DUELIST'},
            {'name': 'SugarZ3ro', 'role': 'CONTROLLER'},
            {'name': 'Dep', 'role': 'FLEX'},
            {'name': 'CLZ', 'role': 'SENTINEL'},
        ]
    },
    'BOOM Esports': {
        'region': 'PACIFIC',
        'short_name': 'BME',
        'color_primary': '#FF4500',
        'players': [
            {'name': 'dos9', 'role': 'CONTROLLER'},
            {'name': 'Famouz', 'role': 'DUELIST'},
            {'name': 'Shiro', 'role': 'FLEX'},
            {'name': 'NcSlasher', 'role': 'INITIATOR'},
            {'name': 'BerserX', 'role': 'SENTINEL'},
        ]
    },
    # China
    'Bilibili Gaming': {
        'region': 'CHINA',
        'short_name': 'BLG',
        'color_primary': '#00A0E9',
        'players': [
            {'name': 'nephh', 'role': 'FLEX'},
            {'name': 'rushia', 'role': 'CONTROLLER'},
            {'name': 'whzy', 'role': 'DUELIST'},
            {'name': 'Knight', 'role': 'INITIATOR'},
            {'name': 'Levius', 'role': 'SENTINEL'},
        ]
    },
    'Edward Gaming': {
        'region': 'CHINA',
        'short_name': 'EDG',
        'color_primary': '#FF0000',
        'players': [
            {'name': 'Smoggy', 'role': 'CONTROLLER'},
            {'name': 'CHICHOO', 'role': 'SENTINEL'},
            {'name': 'nobody', 'role': 'INITIATOR'},
            {'name': 'Jieni7', 'role': 'FLEX'},
            {'name': 'ZmjjKK', 'role': 'DUELIST'},
        ]
    },
    'Tyloo': {
        'region': 'CHINA',
        'short_name': 'TYL',
        'color_primary': '#000000',
        'players': [
            {'name': 'slowly', 'role': 'DUELIST'},
            {'name': 'Ninebody', 'role': 'SENTINEL'},
            {'name': 'Scales', 'role': 'FLEX'},
            {'name': 'Yoyo', 'role': 'CONTROLLER'},
            {'name': 'sword9', 'role': 'INITIATOR'},
        ]
    },
    'Trace Esports': {
        'region': 'CHINA',
        'short_name': 'TE',
        'color_primary': '#FF6B00',
        'players': [
            {'name': 'MarT1n', 'role': 'SENTINEL'},
            {'name': 'Kai', 'role': 'DUELIST'},
            {'name': 'Biank', 'role': 'INITIATOR'},
            {'name': 'FengF', 'role': 'FLEX'},
            {'name': 'LuoK1ng', 'role': 'CONTROLLER'},
        ]
    },
    'JDG Esports': {
        'region': 'CHINA',
        'short_name': 'JDG',
        'color_primary': '#E4032D',
        'players': [
            {'name': 'stew', 'role': 'DUELIST'},
            {'name': 'Babyblue', 'role': 'INITIATOR'},
            {'name':'jkuro', 'role': 'CONTROLLER'},
            {'name': 'Z1yan', 'role': 'FLEX'},
            {'name': 'kklin', 'role': 'SENTINEL'},
        ]
    },
    'Titan Esports Club': {
        'region': 'CHINA',
        'short_name': 'TEC',
        'color_primary': '#FFD700',
        'players': [
            {'name': 'Coco', 'role': 'FLEX'},
            {'name': 'Tvirusluke', 'role': 'DUELIST'},
            {'name': 'Haodong', 'role': 'CONTROLLER'},
            {'name': 'Abo', 'role': 'SENTINEL'},
            {'name': 'lucas', 'role': 'INITIATOR'},
        ]
    },
    'Xi Lai Gaming': {
        'region': 'CHINA',
        'short_name': 'XLG',
        'color_primary': '#1E88E5',
        'players': [
            {'name': 'NoMan', 'role': 'FLEX'},
            {'name': 'happywei', 'role': 'SENTINEL'},
            {'name': 'Viva', 'role': 'INITIATOR'},
            {'name': 'Rarga', 'role': 'DUELIST'},
            {'name': 'coconut', 'role': 'CONTROLLER'},
        ]
    },
    'All Gamers': {
        'region': 'CHINA',
        'short_name': 'AG',
        'color_primary': '#FF0000',
        'players': [
            {'name': 'K1ra', 'role': 'CONTROLLER'},
            {'name': 'Shr1mp', 'role': 'INITIATOR'},
            {'name': 'HanChe', 'role': 'SENTINEL'},
            {'name': 'Spitfires', 'role': 'DUELIST'},
            {'name': 'deLb', 'role': 'FLEX'},
        ]
    },
    'Dragon Ranger Gaming': {
        'region': 'CHINA',
        'short_name': 'DRG',
        'color_primary': '#1E88E5',
        'players': [
            {'name': 'vo0kashu', 'role': 'SENTINEL'},
            {'name': 'Flex1n', 'role': 'CONTROLLER'},
            {'name': 'SpiritZ1', 'role': 'DUELIST'},
            {'name': 'Nicc', 'role': 'INITIATOR'},
            {'name': 'Akeman', 'role': 'FLEX'},
        ]
    },
    'FunPlus Phoenix': {
        'region': 'CHINA',
        'short_name': 'FPX',
        'color_primary': '#FF4655',
        'players': [
            {'name': 'Life', 'role': 'DUELIST'},
            {'name': 'BerLin', 'role': 'CONTROLLER'},
            {'name': 'Autumn', 'role': 'FLEX'},
            {'name': 'yosemite', 'role': 'SENTINEL'},
            {'name': 'AAAY', 'role': 'INITIATOR'},
        ]
    },
    'Nova Esports': {
        'region': 'CHINA',
        'short_name': 'NOVA',
        'color_primary': '#00FF00',
        'players': [
            {'name': 'CB', 'role': 'INITIATOR'},
            {'name': 'Ezeir', 'role': 'CONTROLLER'},
            {'name': 'GuanG', 'role': 'SENTINEL'},
            {'name': 'SWERL', 'role': 'DUELIST'},
            {'name': 'o0o0o', 'role': 'FLEX'},
        ]
    },
    'Wolves Esports': {
        'region': 'CHINA',
        'short_name': 'WOL',
        'color_primary': '#8B0000',
        'players': [
            {'name': 'Juicy', 'role': 'DUELIST'},
            {'name': 'SiuFatBB', 'role': 'INITIATOR'},
            {'name': 'Lysoar', 'role': 'SENTINEL'},
            {'name': 'Yuicaw', 'role': 'CONTROLLER'},
            {'name': 'Spring', 'role': 'FLEX'},
        ]
    },
}


class Command(BaseCommand):
    help = 'Popula o banco de dados com TODAS as 50 equipes e jogadores'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-confirmation',
            action='store_true',
            help='Pula a confirmação de 3 segundos',
        )

    def handle(self, *args, **options):
        if not options.get('skip_confirmation'):
            self.stdout.write(self.style.WARNING('⚠️  Este comando irá DELETAR todos os dados existentes!'))
            self.stdout.write(self.style.WARNING('    Pressione Ctrl+C para cancelar ou aguarde 3 segundos...'))
            
            import time
            try:
                time.sleep(3)
            except KeyboardInterrupt:
                self.stdout.write(self.style.ERROR('\n❌ Cancelado'))
                return
        
        try:
            with transaction.atomic():
                # Limpar dados
                self.stdout.write('\n🗑️  Limpando dados...')
                Player.objects.all().delete()
                Team.objects.all().delete()
                
                teams_created = 0
                players_created = 0
                
                self.stdout.write('\n🏗️  Criando equipes...\n')
                
                for team_name, team_data in TEAMS_DATA.items():
                    # Criar equipe
                    team = Team.objects.create(
                        name=team_name,
                        short_name=team_data['short_name'],
                        region=team_data.get('region', 'AMERICAS'),
                        color_primary=team_data.get('color_primary', '#000000'),
                        color_secondary=team_data.get('color_secondary', '#FFFFFF')
                    )
                    teams_created += 1
                    
                    # Criar jogadores
                    for player_data in team_data['players']:
                        player_name = player_data['name']
                        stats = PLAYER_STATS.get(player_name, {
                            'aim': 10, 'gamesense': 10, 'support': 10, 'clutch': 10
                        })
                        
                        # Calcular rating médio
                        avg_stat = (stats['aim'] + stats['gamesense'] + stats['support'] + stats['clutch']) / 4
                        rating = int((avg_stat / 20) * 100)
                        
                        Player.objects.create(
                            name=player_name,
                            role=player_data['role'],
                            team=team,
                            rating=rating,
                            aim=stats['aim'],
                            gamesense=stats['gamesense'],
                            support=stats['support'],
                            clutch=stats['clutch']
                        )
                        players_created += 1
                    
                    self.stdout.write(f'  ✅ {team_name} ({team_data["short_name"]}) - {len(team_data["players"])} jogadores')
                
                self.stdout.write(self.style.SUCCESS(f'\n✅ Database populada!'))
                self.stdout.write(self.style.SUCCESS(f'   📊 {teams_created} equipes'))
                self.stdout.write(self.style.SUCCESS(f'   👥 {players_created} jogadores'))
                self.stdout.write(self.style.SUCCESS(f'\n💡 Execute: python manage.py import_images'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n❌ Erro: {str(e)}'))
            raise
