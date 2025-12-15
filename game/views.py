from django.shortcuts import render, redirect
from django.shortcuts import render, redirect
from .models import Team, Match, Map

def home(request):
    return render(request, 'game/home.html')

def quick_match_setup(request):
    if request.method == 'POST':
        # Save match setup data in session
        request.session['match_setup'] = {
            'team_a_id': request.POST.get('team_a'),
            'team_b_id': request.POST.get('team_b'),
            'format': request.POST.get('format'),
            'map_ids': request.POST.get('maps'), # Get comma-separated string of map IDs
            'simulation_type': request.POST.get('simulation_type'), # Add simulation type
        }
        # Redirect directly to simulation
        return redirect('simulate_match')

    teams = Team.objects.all()  # Already ordered by region due to Meta.ordering
    maps = Map.objects.all()
    
    # Agrupar times por região
    from collections import defaultdict
    teams_by_region = defaultdict(list)
    for team in teams:
        teams_by_region[team.region].append(team)
    
    import json
    teams_data = []
    for team in teams:
        players = team.players.all()
        
        teams_data.append({
            "id": team.id,
            "name": team.name,
            "logo": team.logo.url if team.logo else None,
            "overall": team.calculate_team_overall(),  # Usa método dinâmico do Team
            "players": [
                {
                    "name": player.name,
                    "role": player.role,
                    "rating": player.calculate_overall(),  # Usa método dinâmico
                    "photo": player.photo.url if player.photo else None
                } for player in players
            ]
        })
    
    return render(request, 'game/quick_match_setup.html', {
        'teams': teams,
        'teams_by_region': dict(teams_by_region),
        'maps': maps,
        'teams_data_json': json.dumps(teams_data)
    })

def simulation_choice(request):
    # This view might be deprecated if we skip it, but keeping it for now or redirecting
    return redirect('quick_match_setup')

def simulate_match(request):
    match_setup = request.session.get('match_setup')
    
    if not match_setup:
        return redirect('quick_match_setup')
    
    # Validate that teams are selected
    team_a_id = match_setup.get('team_a_id')
    team_b_id = match_setup.get('team_b_id')
    
    if not team_a_id or not team_b_id:
        # Clear invalid session data and redirect back
        if 'match_setup' in request.session:
            del request.session['match_setup']
        return redirect('quick_match_setup')
        
    # Get simulation type from session (preferred) or POST (fallback)
    simulation_type = match_setup.get('simulation_type') or request.POST.get('simulation_type')
    
    # Get teams and map
    try:
        team_a = Team.objects.get(id=team_a_id)
        team_b = Team.objects.get(id=team_b_id)
    except (Team.DoesNotExist, ValueError):
        # Clear invalid session data and redirect back
        if 'match_setup' in request.session:
            del request.session['match_setup']
        return redirect('quick_match_setup')
    
    try:
        # Get map IDs string, default to empty
        map_ids_str = match_setup.get('map_ids', '')
        # Split by comma and take the first ID (Primary map for initial record)
        # TODO: For BO3/BO5, we might want to store all selected maps in a M2M relation or JSON field later.
        first_map_id = map_ids_str.split(',')[0] if map_ids_str else None
        
        selected_map = Map.objects.get(id=first_map_id)
        map_name = selected_map.name
    except (Map.DoesNotExist, ValueError, IndexError):
        selected_map = None
        map_name = "Unknown"
    
    # Create match without simulating scores (JavaScript will handle the simulation)
    match = Match.objects.create(
        team_a=team_a,
        team_b=team_b,
        score_a=0,
        score_b=0,
        winner=None,  # Winner will be determined by JavaScript simulation
        format=match_setup['format'],
        map_name=map_name,
        map=selected_map
    )
    
    # Clear session data
    del request.session['match_setup']
    
    # Redirect based on simulation type
    if simulation_type == '2d':
        return redirect(f'/match-result/{match.id}/?mode=2d')
    else:
        return redirect('match_result', match_id=match.id)

def match_result(request, match_id):
    match = Match.objects.get(id=match_id)
    
    import json
    import random

    match_data = {
        "format": match.format,  # Add format to match_data for frontend
        "winner": match.winner.short_name if match.winner else None,
        "map": {
            "name": match.map.name if match.map else match.map_name,
            "minimap": match.map.minimap.url if match.map and match.map.minimap else None
        },
        "championship": {
            "name": match.championship.name if match.championship else "Quick Match",
            "logo": match.championship.logo.url if match.championship and match.championship.logo else None
        },
        "team_a": {
            "name": match.team_a.name,
            "short_name": match.team_a.short_name,
            "color_primary": match.team_a.color_primary,
            "color_secondary": match.team_a.color_secondary,
            "logo": match.team_a.logo.url if match.team_a.logo else None,
            "players": [
                {
                    "name": player.name,
                    "role": player.get_role_display(),
                    "photo": player.photo.url if player.photo else None,
                    "stats": {
                        "aim": player.aim,
                        "gamesense": player.gamesense,
                        "support": player.support,
                        "clutch": player.clutch
                    },
                    "overall": player.calculate_overall()
                } for player in match.team_a.players.all()
            ]
        },
        "team_b": {
            "name": match.team_b.name,
            "short_name": match.team_b.short_name,
            "color_primary": match.team_b.color_primary,
            "color_secondary": match.team_b.color_secondary,
            "logo": match.team_b.logo.url if match.team_b.logo else None,
            "players": [
                {
                    "name": player.name,
                    "role": player.get_role_display(),
                    "photo": player.photo.url if player.photo else None,
                    "stats": {
                        "aim": player.aim,
                        "gamesense": player.gamesense,
                        "support": player.support,
                        "clutch": player.clutch
                    },
                    "overall": player.calculate_overall()
                } for player in match.team_b.players.all()
            ]
        }
    }
    
    return render(request, 'game/match_result.html', {
        'match': match,
        'match_data': match_data,
        'match_data_json': json.dumps(match_data)
    })
