from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.obstacle import Obstacle
from app.models.board import Board
import jwt
from functools import wraps

obstacles_bp = Blueprint('obstacles', __name__)
